import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()

from django.contrib.auth import get_user_model
User = get_user_model()

# --- Tạo Superuser ---
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="admin123"
    )
    print("✅ Superuser 'admin' đã được tạo")
else:
    print("Superuser 'admin' đã tồn tại")

# --- Tạo User bình thường ---
if not User.objects.filter(username="khoatest").exists():
    User.objects.create_user(
        username="khoahuynh133",
        email="khoatest@example.com",
        password="12345",
        is_staff=False,
        is_active=True
    )
    print("✅ User bình thường 'khoatest' đã được tạo")
else:
    print("User 'khoatest' đã tồn tại")
