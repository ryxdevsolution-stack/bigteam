"""
Migration Script: Convert MLM Chain to JSONB Activation History
================================================================

This migration:
1. Adds activation_history JSONB column to users table
2. Migrates existing mlm_chain data to JSONB format
3. Keeps only active rows in mlm_chain (one per user)
4. Preserves complete history in users.activation_history
5. Adds GIN indexes for fast JSONB queries

Run: python activation_history_migration.py
"""

import psycopg2
from datetime import datetime
import json
from utils.db import get_db_connection, return_db_connection


def add_jsonb_column():
    """Step 1: Add activation_history JSONB column to users table"""
    print("\n[STEP 1] Adding activation_history JSONB column to users table...")

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Add JSONB column with default empty object
        cur.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS activation_history JSONB DEFAULT '{"activations": [], "statistics": {}}'::jsonb;
        """)

        conn.commit()
        print("✓ activation_history column added successfully")

        cur.close()
        return True
    except Exception as e:
        conn.rollback()
        print(f"✗ Error adding column: {e}")
        return False
    finally:
        return_db_connection(conn)


def migrate_existing_data():
    """Step 2: Migrate existing mlm_chain data to JSONB format"""
    print("\n[STEP 2] Migrating existing mlm_chain data to JSONB...")

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Get all users who have mlm_chain entries
        cur.execute("""
            SELECT DISTINCT user_id
            FROM mlm_chain
            ORDER BY user_id
        """)

        user_ids = [row[0] for row in cur.fetchall()]
        print(f"Found {len(user_ids)} users with chain entries")

        migrated_count = 0

        for user_id in user_ids:
            # Get all mlm_chain entries for this user (ordered by creation)
            cur.execute("""
                SELECT
                    mc.position,
                    mc.is_active,
                    mc.created_at,
                    mc.deactivated_at,
                    p.package_id,
                    pkg.name as package_name,
                    pkg.amount as package_amount,
                    p.amount as purchase_amount,
                    p.purchase_type,
                    u.sponsored_by
                FROM mlm_chain mc
                LEFT JOIN users u ON mc.user_id = u.id
                LEFT JOIN purchases p ON p.user_id = mc.user_id
                    AND p.status = 'completed'
                    AND p.purchase_type IN ('activation', 'reactivation')
                LEFT JOIN packages pkg ON p.package_id = pkg.id
                WHERE mc.user_id = %s
                ORDER BY mc.created_at ASC
            """, (user_id,))

            chain_entries = cur.fetchall()

            # Build activation history
            activations = []
            activation_number = 1

            for entry in chain_entries:
                position = entry[0]
                is_active = entry[1]
                created_at = entry[2]
                deactivated_at = entry[3]
                package_id = entry[4]
                package_name = entry[5] or "Legacy Package"
                package_amount = float(entry[6]) if entry[6] else 0
                purchase_amount = float(entry[7]) if entry[7] else 0
                purchase_type = entry[8] or "activation"
                sponsored_by = str(entry[9]) if entry[9] else None

                # Calculate days active
                days_active = 0
                if deactivated_at and created_at:
                    days_active = (deactivated_at - created_at).days

                activation_data = {
                    "id": activation_number,
                    "position_in_chain": position,
                    "package": {
                        "id": str(package_id) if package_id else None,
                        "name": package_name,
                        "amount": package_amount or purchase_amount
                    },
                    "timeline": {
                        "activated_at": created_at.isoformat() if created_at else None,
                        "deactivated_at": deactivated_at.isoformat() if deactivated_at else None,
                        "days_active": days_active
                    },
                    "performance": {
                        "commissions_earned": 2 if not is_active else 0,  # If deactivated, earned 2
                        "purchase_type": purchase_type
                    },
                    "sponsor_at_activation": sponsored_by,
                    "is_current": is_active
                }

                activations.append(activation_data)
                activation_number += 1

            # Calculate statistics
            total_activations = len(activations)
            total_days_active = sum(a["timeline"]["days_active"] for a in activations)
            average_days_active = total_days_active / total_activations if total_activations > 0 else 0

            # Get most used package
            package_counts = {}
            for a in activations:
                pkg_name = a["package"]["name"]
                package_counts[pkg_name] = package_counts.get(pkg_name, 0) + 1

            favorite_package = max(package_counts.items(), key=lambda x: x[1])[0] if package_counts else None

            history_data = {
                "activations": activations,
                "statistics": {
                    "total_activations": total_activations,
                    "total_days_active": total_days_active,
                    "average_days_active": round(average_days_active, 2),
                    "favorite_package": favorite_package,
                    "last_updated": datetime.now().isoformat()
                }
            }

            # Update user with activation history
            cur.execute("""
                UPDATE users
                SET activation_history = %s::jsonb
                WHERE id = %s
            """, (json.dumps(history_data), user_id))

            migrated_count += 1

            if migrated_count % 10 == 0:
                print(f"  Migrated {migrated_count}/{len(user_ids)} users...")

        conn.commit()
        print(f"✓ Successfully migrated {migrated_count} users")

        cur.close()
        return True
    except Exception as e:
        conn.rollback()
        print(f"✗ Error migrating data: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        return_db_connection(conn)


def cleanup_old_chain_entries():
    """Step 3: Remove deactivated entries from mlm_chain (keep only active)"""
    print("\n[STEP 3] Cleaning up old deactivated mlm_chain entries...")

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Count deactivated entries
        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = false")
        deactivated_count = cur.fetchone()[0]

        print(f"Found {deactivated_count} deactivated entries to remove")

        # Delete deactivated entries (history is now in JSONB)
        cur.execute("""
            DELETE FROM mlm_chain
            WHERE is_active = false
        """)

        deleted_count = cur.rowcount

        conn.commit()
        print(f"✓ Deleted {deleted_count} old deactivated entries")

        # Show remaining entries
        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = true")
        active_count = cur.fetchone()[0]
        print(f"  Remaining active entries: {active_count}")

        cur.close()
        return True
    except Exception as e:
        conn.rollback()
        print(f"✗ Error cleaning up: {e}")
        return False
    finally:
        return_db_connection(conn)


def add_indexes():
    """Step 4: Add GIN indexes for fast JSONB queries"""
    print("\n[STEP 4] Adding GIN indexes for JSONB queries...")

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Add GIN index on activation_history for fast JSON queries
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_activation_history_gin
            ON users USING GIN(activation_history);
        """)
        print("✓ Created GIN index: idx_users_activation_history_gin")

        # Add index for statistics queries
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_activation_stats
            ON users USING GIN((activation_history->'statistics'));
        """)
        print("✓ Created GIN index: idx_users_activation_stats")

        # Add index for searching activations array
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_activations_array
            ON users USING GIN((activation_history->'activations'));
        """)
        print("✓ Created GIN index: idx_users_activations_array")

        conn.commit()
        print("✓ All indexes created successfully")

        cur.close()
        return True
    except Exception as e:
        conn.rollback()
        print(f"✗ Error creating indexes: {e}")
        return False
    finally:
        return_db_connection(conn)


def verify_migration():
    """Step 5: Verify migration was successful"""
    print("\n[STEP 5] Verifying migration...")

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Check users with activation history
        cur.execute("""
            SELECT COUNT(*)
            FROM users
            WHERE activation_history IS NOT NULL
            AND jsonb_array_length(activation_history->'activations') > 0
        """)
        users_with_history = cur.fetchone()[0]

        # Check total activations across all users
        cur.execute("""
            SELECT SUM(jsonb_array_length(activation_history->'activations'))
            FROM users
            WHERE activation_history IS NOT NULL
        """)
        total_activations = cur.fetchone()[0] or 0

        # Check remaining mlm_chain entries (should be only active ones)
        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = true")
        active_chain_entries = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = false")
        deactivated_chain_entries = cur.fetchone()[0]

        print("\n" + "="*60)
        print("MIGRATION SUMMARY")
        print("="*60)
        print(f"✓ Users with activation history: {users_with_history}")
        print(f"✓ Total activations recorded: {total_activations}")
        print(f"✓ Active mlm_chain entries: {active_chain_entries}")
        print(f"✓ Deactivated mlm_chain entries: {deactivated_chain_entries}")

        if deactivated_chain_entries == 0:
            print("\n✓✓✓ Migration completed successfully! ✓✓✓")
        else:
            print(f"\n⚠ Warning: Still {deactivated_chain_entries} deactivated entries remaining")

        print("="*60)

        # Show sample activation history
        cur.execute("""
            SELECT u.username, u.activation_history
            FROM users u
            WHERE jsonb_array_length(u.activation_history->'activations') > 0
            LIMIT 1
        """)

        sample = cur.fetchone()
        if sample:
            print("\nSample activation history:")
            print(f"User: {sample[0]}")
            print(json.dumps(sample[1], indent=2))

        cur.close()
        return True
    except Exception as e:
        print(f"✗ Error verifying migration: {e}")
        return False
    finally:
        return_db_connection(conn)


def main():
    """Run complete migration"""
    print("="*60)
    print("ACTIVATION HISTORY MIGRATION")
    print("="*60)
    print("\nThis will:")
    print("1. Add activation_history JSONB column")
    print("2. Migrate existing mlm_chain data")
    print("3. Clean up old deactivated entries")
    print("4. Add performance indexes")
    print("5. Verify migration")

    response = input("\nProceed with migration? (yes/no): ")

    if response.lower() != 'yes':
        print("Migration cancelled")
        return

    # Run migration steps
    steps = [
        ("Add JSONB column", add_jsonb_column),
        ("Migrate data", migrate_existing_data),
        ("Cleanup old entries", cleanup_old_chain_entries),
        ("Add indexes", add_indexes),
        ("Verify", verify_migration)
    ]

    for step_name, step_func in steps:
        print(f"\n{'='*60}")
        success = step_func()
        if not success:
            print(f"\n✗ Migration failed at step: {step_name}")
            print("Rolling back is recommended. Check database state.")
            return

    print("\n" + "="*60)
    print("✓✓✓ MIGRATION COMPLETED SUCCESSFULLY ✓✓✓")
    print("="*60)
    print("\nNext steps:")
    print("1. Update team_service.py to use JSONB")
    print("2. Test activation/reactivation flow")
    print("3. Update frontend to show history")


if __name__ == "__main__":
    main()
