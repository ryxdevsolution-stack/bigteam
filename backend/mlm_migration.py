"""
MLM System Database Migration
Creates and extends tables for MLM referral system
"""
import os
import sys
from dotenv import load_dotenv
from .utils.db import get_db_connection, return_db_connection

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()


def run_migration():
    """Run MLM database migration"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=> Starting MLM Migration...")

        # Step 1: Extend users table with MLM fields
        print("\n[Step 1] Extending users table with MLM fields...")

        mlm_user_fields = [
            ("sponsored_by", "UUID REFERENCES users(id)"),
            ("referral_code", "VARCHAR(20) UNIQUE"),
            ("is_mlm_active", "BOOLEAN DEFAULT false"),
            ("activation_date", "TIMESTAMP"),
            ("commission_received_count", "INTEGER DEFAULT 0"),
            ("total_earnings", "DECIMAL(10,2) DEFAULT 0"),
            ("available_balance", "DECIMAL(10,2) DEFAULT 0"),
            ("pending_balance", "DECIMAL(10,2) DEFAULT 0"),
        ]

        for field_name, field_type in mlm_user_fields:
            try:
                # Check if column exists
                cur.execute(f"""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name='users' AND column_name=%s
                """, (field_name,))

                if cur.fetchone() is None:
                    cur.execute(f"ALTER TABLE users ADD COLUMN {field_name} {field_type}")
                    print(f"  [OK] Added column: {field_name}")
                else:
                    print(f"  [SKIP] Column already exists: {field_name}")
            except Exception as e:
                print(f"  [WARN] Error adding {field_name}: {e}")

        conn.commit()

        # Step 2: Create purchases table
        print("\n[Step 2] Creating purchases table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS purchases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                product_name VARCHAR(255),
                amount DECIMAL(10,2) NOT NULL,
                purchase_type VARCHAR(50) DEFAULT 'activation',
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("  [OK] Purchases table created")

        # Create index for user_id
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_purchases_user_id
            ON purchases(user_id)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_purchases_created_at
            ON purchases(created_at DESC)
        """)
        print("  [OK] Purchases indexes created")

        conn.commit()

        # Step 3: Create commissions table
        print("\n[Step 3] Creating commissions table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS commissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                receiver_id UUID NOT NULL REFERENCES users(id),
                payer_id UUID NOT NULL REFERENCES users(id),
                purchase_id UUID REFERENCES purchases(id),
                amount DECIMAL(10,2) NOT NULL,
                commission_level INTEGER,
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("  [OK] Commissions table created")

        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_commissions_receiver_id
            ON commissions(receiver_id)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_commissions_payer_id
            ON commissions(payer_id)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_commissions_created_at
            ON commissions(created_at DESC)
        """)
        print("  [OK] Commissions indexes created")

        conn.commit()

        # Step 4: Create mlm_chain table
        print("\n[Step 4] Creating mlm_chain table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS mlm_chain (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                position INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                deactivated_at TIMESTAMP
            )
        """)
        print("  [OK] MLM chain table created")

        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_mlm_chain_user_id
            ON mlm_chain(user_id)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_mlm_chain_position
            ON mlm_chain(position)
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_mlm_chain_active
            ON mlm_chain(is_active) WHERE is_active = true
        """)
        print("  [OK] MLM chain indexes created")

        conn.commit()

        # Step 5: Create mlm_settings table
        print("\n[Step 5] Creating mlm_settings table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS mlm_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value VARCHAR(255) NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("  [OK] MLM settings table created")

        conn.commit()

        # Step 6: Insert default MLM settings
        print("\n[Step 6] Inserting default MLM settings...")

        default_settings = [
            ('activation_amount', '1000', 'Amount required for activation (in currency units)'),
            ('commission_rate', '0.15', 'Commission rate (15% = 0.15)'),
            ('commission_limit', '2', 'Number of commissions before deactivation'),
            ('currency', 'INR', 'Currency for transactions'),
        ]

        for key, value, desc in default_settings:
            cur.execute("""
                INSERT INTO mlm_settings (setting_key, setting_value, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (setting_key)
                DO UPDATE SET
                    setting_value = EXCLUDED.setting_value,
                    description = EXCLUDED.description,
                    updated_at = NOW()
            """, (key, value, desc))
            print(f"  [OK] Setting: {key} = {value}")

        conn.commit()

        # Step 7: Verify migration
        print("\n[Step 7] Verifying migration...")

        tables_to_check = ['purchases', 'commissions', 'mlm_chain', 'mlm_settings']
        for table in tables_to_check:
            cur.execute("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_name = %s
            """, (table,))
            count = cur.fetchone()[0]
            if count > 0:
                print(f"  [OK] Table verified: {table}")
            else:
                print(f"  [ERROR] Table missing: {table}")

        # Check MLM settings count
        cur.execute("SELECT COUNT(*) FROM mlm_settings")
        settings_count = cur.fetchone()[0]
        print(f"\n[INFO] MLM Settings loaded: {settings_count} settings")

        cur.close()

        print("\n[SUCCESS] MLM Migration completed successfully!")
        print("\n[Summary]")
        print("  [OK] Extended users table with MLM fields")
        print("  [OK] Created purchases table")
        print("  [OK] Created commissions table")
        print("  [OK] Created mlm_chain table")
        print("  [OK] Created mlm_settings table")
        print("  [OK] Inserted default settings")

    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            return_db_connection(conn)


if __name__ == "__main__":
    run_migration()
