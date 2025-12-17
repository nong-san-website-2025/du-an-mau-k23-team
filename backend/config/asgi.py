# config/asgi.py
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Khởi tạo Django xong xuôi rồi mới import các thành phần khác
django_asgi_app = get_asgi_application()

# Import sau khi django_asgi_app đã được tạo
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.auth import JWTAuthMiddlewareStack
from chat.routing import websocket_urlpatterns 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})