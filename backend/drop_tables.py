import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("DROP TABLE IF EXISTS payments_wallettransaction")
    cursor.execute("DROP TABLE IF EXISTS payments_sellerwallet")
    print("✅ Đã xóa bảng")
