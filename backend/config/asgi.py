# config/asgi.py
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

# --- QUAN TRỌNG: Import cái Middleware bạn vừa viết ---
# Giả sử bạn lưu file code trên ở chat/middleware.py
from chat.middleware import JWTAuthMiddlewareStack 
from chat.routing import websocket_urlpatterns 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(  # <--- Bọc ở đây
            URLRouter(websocket_urlpatterns)
        )
    ),
})