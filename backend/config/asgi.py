import os

# Ensure settings configured before importing modules that use them
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.auth import JWTAuthMiddlewareStack

# Lấy ứng dụng Django gốc (khởi tạo Django + load apps)
django_asgi_app = get_asgi_application()

# Import routing SAU khi Django đã sẵn sàng để tránh AppRegistryNotReady
from chat import routing as chat_routing

# Ứng dụng ASGI cho cả HTTP và WebSocket
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            chat_routing.websocket_urlpatterns
        )
    ),
})
