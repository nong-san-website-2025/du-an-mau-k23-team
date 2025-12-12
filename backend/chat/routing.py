from django.urls import re_path
from .consumers import ChatConsumer
from .consumers import ConversationConsumer

websocket_urlpatterns = [
    # Legacy: user connects with seller_id; kept for backward-compat
    re_path(r"^ws/chat/(?P<seller_id>\d+)/$", ChatConsumer.as_asgi()),

    # New: conversation-based WebSocket ensures both buyer and seller join the same room
    re_path(r"^ws/chat/conv/(?P<conversation_id>\d+)/$", ConversationConsumer.as_asgi()),
]