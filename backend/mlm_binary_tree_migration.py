"""
MLM Binary Tree Migration - Convert linear chain to binary tree with spillover
Implements 2-level commission system where users cycle out after receiving 30% (2x15%)
"""
import os
import sys
from dotenv import load_dotenv
from utils.db import get_db_connection, return_db_connection

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()


def run_binary_tree_migration():
    """Migrate to binary tree MLM structure"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("🌳 Starting Binary Tree MLM Migration...")

        # Step 1: Add binary tree columns to users table
        print("\n[Step 1] Adding binary tree columns...")

        binary_tree_fields = [
            ("left_child_id", "UUID REFERENCES users(id)"),
            ("right_child_id", "UUID REFERENCES users(id)"),
            ("tree_position", "VARCHAR(20)"),  # 'left' or 'right' under sponsor
            ("placement_sponsor_id", "UUID REFERENCES users(id)"),  # Who placed them (may differ from referrer)
            ("is_hidden", "BOOLEAN DEFAULT false"),  # Hidden after completing cycle
            ("cycle_count", "INTEGER DEFAULT 0"),  # How many times user has cycled
            ("last_hidden_at", "TIMESTAMP"),  # When user last completed cycle
        ]

        for field_name, field_type in binary_tree_fields:
            try:
                cur.execute(f"""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name='users' AND column_name=%s
                """, (field_name,))

                if cur.fetchone() is None:
                    cur.execute(f"ALTER TABLE users ADD COLUMN {field_name} {field_type}")
                    print(f"  ✅ Added column: {field_name}")
                else:
                    print(f"  ⏭️  Column already exists: {field_name}")
            except Exception as e:
                print(f"  ⚠️  Error adding {field_name}: {e}")

        conn.commit()

        # Step 2: Create binary tree positions table (for history/tracking)
        print("\n[Step 2] Creating binary_tree_positions table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS binary_tree_positions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                sponsor_id UUID NOT NULL REFERENCES users(id),
                placement_sponsor_id UUID NOT NULL REFERENCES users(id),
                position VARCHAR(20) NOT NULL,  -- 'left' or 'right'
                is_active BOOLEAN DEFAULT true,
                cycle_number INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW(),
                deactivated_at TIMESTAMP
            )
        """)
        print("  ✅ Binary tree positions table created")

        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_tree_positions_user
            ON binary_tree_positions(user_id)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_tree_positions_sponsor
            ON binary_tree_positions(sponsor_id)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_tree_positions_placement
            ON binary_tree_positions(placement_sponsor_id)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_tree_positions_active
            ON binary_tree_positions(is_active) WHERE is_active = true
        """)
        print("  ✅ Binary tree positions indexes created")

        conn.commit()

        # Step 3: Update commissions table to track commission levels
        print("\n[Step 3] Updating commissions table...")

        # Check if commission_level_type column exists
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='commissions' AND column_name='commission_level_type'
        """)

        if cur.fetchone() is None:
            cur.execute("""
                ALTER TABLE commissions
                ADD COLUMN commission_level_type VARCHAR(20) DEFAULT 'direct'
            """)
            print("  ✅ Added commission_level_type column (direct/second_level)")
        else:
            print("  ⏭️  commission_level_type already exists")

        # Add comment to clarify commission levels
        cur.execute("""
            COMMENT ON COLUMN commissions.commission_level IS
            'Level 1 = direct child (15%), Level 2 = grandchild (15%)'
        """)

        conn.commit()

        # Step 4: Update MLM settings for binary tree
        print("\n[Step 4] Updating MLM settings for binary tree...")

        binary_settings = [
            ('mlm_type', 'binary_tree', 'MLM structure type'),
            ('spillover_enabled', 'true', 'Enable automatic spillover placement'),
            ('level_1_commission', '0.15', 'Direct referral commission (15%)'),
            ('level_2_commission', '0.15', 'Second level commission (15%)'),
            ('commission_limit', '2', 'Number of commissions before cycling out'),
            ('auto_hide_on_cycle', 'true', 'Hide user after completing cycle'),
            ('reactivation_placement', 'bottom', 'Where to place reactivated users (bottom/sponsor)'),
        ]

        for key, value, desc in binary_settings:
            cur.execute("""
                INSERT INTO mlm_settings (setting_key, setting_value, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (setting_key)
                DO UPDATE SET
                    setting_value = EXCLUDED.setting_value,
                    description = EXCLUDED.description,
                    updated_at = NOW()
            """, (key, value, desc))
            print(f"  ✅ Setting: {key} = {value}")

        conn.commit()

        # Step 5: Add indexes to users table for binary tree queries
        print("\n[Step 5] Adding binary tree indexes...")

        indexes = [
            ("idx_users_left_child", "left_child_id"),
            ("idx_users_right_child", "right_child_id"),
            ("idx_users_placement_sponsor", "placement_sponsor_id"),
            ("idx_users_hidden", "is_hidden"),
        ]

        for idx_name, column in indexes:
            cur.execute(f"""
                CREATE INDEX IF NOT EXISTS {idx_name}
                ON users({column})
            """)
            print(f"  ✅ Created index: {idx_name}")

        conn.commit()

        # Step 6: Create helper functions/views
        print("\n[Step 6] Creating helper functions...")

        # Create view for active tree structure
        cur.execute("""
            CREATE OR REPLACE VIEW v_active_tree AS
            SELECT
                u.id,
                u.username,
                u.full_name,
                u.sponsored_by,
                u.placement_sponsor_id,
                u.left_child_id,
                u.right_child_id,
                u.tree_position,
                u.is_mlm_active,
                u.is_hidden,
                u.commission_received_count,
                u.cycle_count,
                u.total_earnings
            FROM users u
            WHERE u.is_hidden = false OR u.is_hidden IS NULL
        """)
        print("  ✅ Created v_active_tree view")

        conn.commit()

        # Verification
        print("\n[Step 7] Verifying migration...")

        # Check new columns
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='users'
            AND column_name IN ('left_child_id', 'right_child_id', 'is_hidden')
        """)
        columns_added = cur.fetchall()
        print(f"  ✅ Binary tree columns added: {len(columns_added)}")

        # Check new table
        cur.execute("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'binary_tree_positions'
        """)
        table_exists = cur.fetchone()[0]
        print(f"  ✅ Binary tree positions table: {'Created' if table_exists else 'Missing'}")

        # Check settings
        cur.execute("""
            SELECT COUNT(*) FROM mlm_settings
            WHERE setting_key LIKE 'level_%_commission'
        """)
        settings_count = cur.fetchone()[0]
        print(f"  ✅ Binary tree settings: {settings_count} commission settings")

        cur.close()

        print("\n✅ Binary Tree MLM Migration completed successfully!")
        print("\n📋 Summary:")
        print("  ✅ Added binary tree columns to users table")
        print("  ✅ Created binary_tree_positions tracking table")
        print("  ✅ Updated commissions table for 2-level tracking")
        print("  ✅ Updated MLM settings for binary tree system")
        print("  ✅ Created indexes for performance")
        print("  ✅ Created helper views for queries")
        print("\n🌳 Your MLM system is now a Binary Tree with Spillover!")
        print("\n📌 Next Steps:")
        print("  1. Update backend services to use new tree structure")
        print("  2. Implement spillover placement algorithm")
        print("  3. Update frontend to display binary tree")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            return_db_connection(conn)


if __name__ == "__main__":
    run_binary_tree_migration()
