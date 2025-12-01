import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def drop_all_tables():
    with connection.cursor() as cursor:
        # Get all table names
        cursor.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
        """)
        tables = cursor.fetchall()
        for table in tables:
            table_name = table[0]
            print(f"Dropping table {table_name}")
            cursor.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
        print("✅ Đã xóa tất cả bảng")

if __name__ == "__main__":
    drop_all_tables()