import os
import pathlib

backend_path = pathlib.Path(r'e:\A_Code\du-an-mau-k23-team\backend')

for app_dir in backend_path.iterdir():
    if app_dir.is_dir():
        migrations_path = app_dir / 'migrations'
        if migrations_path.exists():
            deleted_count = 0
            for migration_file in migrations_path.glob('*.py'):
                if migration_file.name != '__init__.py':
                    migration_file.unlink()
                    print(f"Deleted: {migration_file}")
                    deleted_count += 1
            if deleted_count > 0:
                print(f"[OK] Removed {deleted_count} migrations from {app_dir.name}")
            else:
                print(f"[OK] {app_dir.name} - no migrations to delete")

print("\n[DONE] All migrations have been deleted.")
