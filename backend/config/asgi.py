import os
import django
from django.core.asgi import get_asgi_application

# 1. Thiết lập môi trường trước
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup() # Đảm bảo Django đã sẵn sàng

# 2. Khởi tạo ứng dụng HTTP ASGI
django_asgi_app = get_asgi_application()

# 3. Import các thành phần Channels SAU KHI đã gọi django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.middleware import JWTAuthMiddlewareStack 
from chat.routing import websocket_urlpatterns 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})