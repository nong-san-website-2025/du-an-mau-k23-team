# backend/config/asgi.py
import os
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import websockets.routing  # import module websocket routing

# Chỉ định file settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # HTTP request
    "websocket": AuthMiddlewareStack(
        URLRouter(websockets.routing.websocket_urlpatterns)  # WebSocket request
    ),
})
