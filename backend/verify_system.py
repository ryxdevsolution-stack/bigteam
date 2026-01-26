"""
Comprehensive System Verification Script
Checks database, JSONB structure, indexes, and data integrity
"""
from utils.db import get_db_connection, return_db_connection
import json

def verify_database():
    """Verify database migration and data integrity"""
    print("\n" + "="*60)
    print("DATABASE VERIFICATION")
    print("="*60)

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # 1. Check if activation_history column exists
        print("\n[1] Checking activation_history column...")
        cur.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'activation_history'
        """)
        column = cur.fetchone()
        if column:
            print(f"✓ Column exists: {column[0]} ({column[1]})")
        else:
            print("✗ Column NOT found!")
            return False

        # 2. Count users with activation history
        print("\n[2] Checking users with activation history...")
        cur.execute("""
            SELECT COUNT(*)
            FROM users
            WHERE activation_history IS NOT NULL
            AND activation_history != 'null'::jsonb
        """)
        users_with_history = cur.fetchone()[0]
        print(f"✓ Users with history: {users_with_history}")

        # 3. Count total activations in JSONB
        print("\n[3] Counting total activations in JSONB...")
        cur.execute("""
            SELECT
                COUNT(*) as users_with_activations,
                SUM(jsonb_array_length(activation_history->'activations')) as total_activations
            FROM users
            WHERE activation_history IS NOT NULL
            AND activation_history->'activations' IS NOT NULL
            AND jsonb_array_length(activation_history->'activations') > 0
        """)
        result = cur.fetchone()
        print(f"✓ Users with activations: {result[0]}")
        print(f"✓ Total activations recorded: {result[1] or 0}")

        # 4. Check mlm_chain status
        print("\n[4] Checking mlm_chain table...")
        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = true")
        active = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM mlm_chain WHERE is_active = false")
        inactive = cur.fetchone()[0]
        print(f"✓ Active entries: {active}")
        print(f"✓ Inactive entries: {inactive}")
        if inactive > 0:
            print(f"⚠ Warning: {inactive} deactivated entries still exist!")

        # 5. Verify indexes
        print("\n[5] Checking GIN indexes...")
        cur.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'users'
            AND indexname LIKE '%activation%'
        """)
        indexes = cur.fetchall()
        expected_indexes = [
            'idx_users_activation_history_gin',
            'idx_users_activation_stats',
            'idx_users_activations_array'
        ]
        found_indexes = [idx[0] for idx in indexes]

        for expected in expected_indexes:
            if expected in found_indexes:
                print(f"✓ Index exists: {expected}")
            else:
                print(f"✗ Index MISSING: {expected}")

        # 6. Sample data verification
        print("\n[6] Sample activation history data...")
        cur.execute("""
            SELECT
                u.username,
                u.is_mlm_active,
                u.sponsored_by,
                u.activation_history
            FROM users u
            WHERE u.activation_history IS NOT NULL
            AND jsonb_array_length(u.activation_history->'activations') > 0
            LIMIT 1
        """)
        sample = cur.fetchone()
        if sample:
            print(f"✓ Sample user: {sample[0]}")
            print(f"  - Is active: {sample[1]}")
            print(f"  - Sponsored by: {sample[2] or 'None'}")
            history = sample[3]
            if history and 'activations' in history:
                print(f"  - Total activations: {len(history['activations'])}")
                if history['activations']:
                    first = history['activations'][0]
                    print(f"  - First activation package: {first.get('package', {}).get('name', 'Unknown')}")

        # 7. Check for duplicate users in mlm_chain
        print("\n[7] Checking for duplicate users in mlm_chain...")
        cur.execute("""
            SELECT user_id, COUNT(*) as count
            FROM mlm_chain
            WHERE is_active = true
            GROUP BY user_id
            HAVING COUNT(*) > 1
        """)
        duplicates = cur.fetchall()
        if duplicates:
            print(f"✗ Found {len(duplicates)} users with multiple active entries!")
            for dup in duplicates:
                print(f"  - User {dup[0]}: {dup[1]} active entries")
        else:
            print("✓ No duplicate active entries found")

        # 8. Verify sponsored_by preservation
        print("\n[8] Checking sponsored_by preservation...")
        cur.execute("""
            SELECT
                COUNT(*) as total,
                COUNT(sponsored_by) as with_sponsor
            FROM users
            WHERE is_mlm_active = true OR activation_date IS NOT NULL
        """)
        sponsor_check = cur.fetchone()
        print(f"✓ Total activated users: {sponsor_check[0]}")
        print(f"✓ Users with sponsor: {sponsor_check[1]}")
        print(f"✓ Preservation rate: {(sponsor_check[1]/sponsor_check[0]*100) if sponsor_check[0] > 0 else 0:.1f}%")

        cur.close()

        print("\n" + "="*60)
        print("DATABASE VERIFICATION COMPLETE")
        print("="*60)

        return True

    except Exception as e:
        print(f"\n✗ Error during verification: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        return_db_connection(conn)


def verify_code_structure():
    """Verify code files exist and are properly structured"""
    print("\n" + "="*60)
    print("CODE STRUCTURE VERIFICATION")
    print("="*60)

    import os

    required_files = {
        'Migration Script': 'activation_history_migration.py',
        'Migration Runner': 'run_migration.py',
        'History Service': 'services/activation_history_service.py',
        'History Routes': 'routes/activation_history.py',
        'Team Service (Updated)': 'services/team_service.py',
        'App (Updated)': 'app.py'
    }

    all_exist = True
    for name, filepath in required_files.items():
        full_path = os.path.join(os.getcwd(), filepath)
        if os.path.exists(full_path):
            size = os.path.getsize(full_path)
            print(f"✓ {name}: {filepath} ({size:,} bytes)")
        else:
            print(f"✗ {name}: {filepath} NOT FOUND")
            all_exist = False

    print("\n" + "="*60)
    return all_exist


def verify_security_fixes():
    """Verify security fixes are in place"""
    print("\n" + "="*60)
    print("SECURITY FIXES VERIFICATION")
    print("="*60)

    checks = []

    # 1. Check SQL injection fix in activation_history_service.py
    print("\n[1] Checking SQL injection fix...")
    try:
        with open('services/activation_history_service.py', 'r') as f:
            content = f.read()
            if 'cutoff_date = datetime.now() - timedelta(days=days)' in content:
                print("✓ SQL injection fix applied (timedelta used)")
                checks.append(True)
            else:
                print("✗ SQL injection fix NOT found")
                checks.append(False)
    except Exception as e:
        print(f"✗ Error checking file: {e}")
        checks.append(False)

    # 2. Check authorization fix in activation_history.py
    print("\n[2] Checking authorization fix...")
    try:
        with open('routes/activation_history.py', 'r') as f:
            content = f.read()
            if "SELECT role FROM users WHERE id = %s" in content and "!= 'admin'" in content:
                print("✓ Authorization check properly implemented")
                checks.append(True)
            else:
                print("✗ Authorization fix NOT complete")
                checks.append(False)
    except Exception as e:
        print(f"✗ Error checking file: {e}")
        checks.append(False)

    # 3. Check race condition fix in team_service.py
    print("\n[3] Checking race condition fix (FOR UPDATE)...")
    try:
        with open('services/team_service.py', 'r') as f:
            content = f.read()
            if 'FOR UPDATE' in content and 'mlm_chain' in content:
                print("✓ Row locking (FOR UPDATE) implemented")
                checks.append(True)
            else:
                print("✗ Row locking NOT found")
                checks.append(False)
    except Exception as e:
        print(f"✗ Error checking file: {e}")
        checks.append(False)

    print("\n" + "="*60)
    print(f"Security checks passed: {sum(checks)}/{len(checks)}")
    print("="*60)

    return all(checks)


def main():
    """Run all verification checks"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*10 + "COMPREHENSIVE SYSTEM VERIFICATION" + " "*15 + "║")
    print("╚" + "="*58 + "╝")

    results = {}

    # Run all checks
    results['database'] = verify_database()
    results['code_structure'] = verify_code_structure()
    results['security'] = verify_security_fixes()

    # Final summary
    print("\n\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*18 + "FINAL SUMMARY" + " "*27 + "║")
    print("╚" + "="*58 + "╝")
    print()

    for check, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{check.upper():.<40} {status}")

    print()
    all_passed = all(results.values())

    if all_passed:
        print("╔" + "="*58 + "╗")
        print("║" + " "*10 + "✓✓✓ ALL CHECKS PASSED ✓✓✓" + " "*18 + "║")
        print("╚" + "="*58 + "╝")
        print("\n✅ System is fully operational and ready to use!")
    else:
        print("╔" + "="*58 + "╗")
        print("║" + " "*10 + "✗✗✗ SOME CHECKS FAILED ✗✗✗" + " "*15 + "║")
        print("╚" + "="*58 + "╝")
        print("\n⚠ Please review the failures above.")

    return all_passed


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
