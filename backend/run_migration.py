"""
Non-interactive migration runner
"""
from activation_history_migration import (
    add_jsonb_column,
    migrate_existing_data,
    cleanup_old_chain_entries,
    add_indexes,
    verify_migration
)

def main():
    """Run complete migration without prompts"""
    print("="*60)
    print("ACTIVATION HISTORY MIGRATION - AUTO RUN")
    print("="*60)

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
            print("Please check database state and logs.")
            return False

    print("\n" + "="*60)
    print("✓✓✓ MIGRATION COMPLETED SUCCESSFULLY ✓✓✓")
    print("="*60)
    return True


if __name__ == "__main__":
    main()
