import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

import chat.routing  # nếu bạn có app tên chat

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Lấy ứng dụng Django gốc
django_asgi_app = get_asgi_application()

# Ứng dụng ASGI cho cả HTTP và WebSocket
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})
