import os
import django

# 1. Thiết lập biến môi trường
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 2. Setup Django trước khi import các phần khác
django.setup()

# 3. Import sau khi setup
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import chat.routing  # ✅ Phải import dòng này nếu bạn dùng chat.routing ở dưới

# 4. Định nghĩa ứng dụng ASGI
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(
        chat.routing.websocket_urlpatterns
    ),
})
