"""
Package System Migration Script
Adds packages table and package_id column to purchases table for existing databases
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()


def run_migration():
    """Run the package system migration"""

    conn = None
    cur = None

    try:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT", 5432)
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        print("Starting package system migration...")

        # Step 1: Create packages table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS packages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                commission_percentage DECIMAL(5, 2) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                is_deleted BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Packages table created/verified")

        # Step 2: Add package_id column to purchases table if not exists
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'purchases' AND column_name = 'package_id'
        """)

        if not cur.fetchone():
            cur.execute("""
                ALTER TABLE purchases
                ADD COLUMN package_id UUID
            """)
            print("✓ Added package_id column to purchases table")
        else:
            print("✓ package_id column already exists in purchases table")

        # Step 3: Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_packages_deleted ON packages(is_deleted)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_purchases_package ON purchases(package_id)")
        print("✓ Indexes created/verified")

        # Step 4: Verify migration
        cur.execute("SELECT COUNT(*) FROM packages")
        package_count = cur.fetchone()[0]
        print(f"\nMigration complete! Current packages count: {package_count}")

        if package_count == 0:
            print("\nNote: No packages exist yet. Admin needs to create packages through the UI.")

    except Exception as e:
        print(f"Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    return True


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
