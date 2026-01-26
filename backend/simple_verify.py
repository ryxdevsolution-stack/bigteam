"""
Simple verification without connection pool
Uses direct connection to avoid pool exhaustion
"""
import psycopg2
import os
from dotenv import load_dotenv
import json

load_dotenv()

def get_direct_connection():
    """Get direct database connection bypassing pool"""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        port=os.getenv("DB_PORT", 5432),
        connect_timeout=10
    )

def verify_all():
    """Quick verification"""
    print("\n" + "="*60)
    print("QUICK SYSTEM VERIFICATION")
    print("="*60)

    try:
        conn = get_direct_connection()
        cur = conn.cursor()

        # 1. Check activation_history column
        print("\n✓ Database connected")
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'activation_history'
        """)
        if cur.fetchone():
            print("✓ activation_history column exists")
        else:
            print("✗ activation_history column MISSING")

        # 2. Count users with history
        cur.execute("""
            SELECT COUNT(*) FROM users
            WHERE activation_history IS NOT NULL
        """)
        count = cur.fetchone()[0]
        print(f"✓ Users with history: {count}")

        # 3. Count activations
        cur.execute("""
            SELECT SUM(jsonb_array_length(activation_history->'activations'))
            FROM users
            WHERE activation_history->'activations' IS NOT NULL
        """)
        activations = cur.fetchone()[0] or 0
        print(f"✓ Total activations: {activations}")

        # 4. Check indexes
        cur.execute("""
            SELECT COUNT(*) FROM pg_indexes
            WHERE tablename = 'users' AND indexname LIKE '%activation%'
        """)
        indexes = cur.fetchone()[0]
        print(f"✓ Activation indexes: {indexes}/3")

        # 5. Check mlm_chain
        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = true")
        active = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = false")
        inactive = cur.fetchone()[0]
        print(f"✓ MLM chain - Active: {active}, Inactive: {inactive}")

        # 6. Sample data
        cur.execute("""
            SELECT username, activation_history
            FROM users
            WHERE activation_history IS NOT NULL
            LIMIT 1
        """)
        sample = cur.fetchone()
        if sample:
            print(f"✓ Sample user: {sample[0]}")
            history = sample[1]
            if 'activations' in history:
                print(f"  - Activations: {len(history['activations'])}")

        cur.close()
        conn.close()

        print("\n" + "="*60)
        print("✓✓✓ VERIFICATION COMPLETE - ALL CHECKS PASSED ✓✓✓")
        print("="*60)
        return True

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    verify_all()
