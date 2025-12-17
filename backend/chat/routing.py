# chat/routing.py
from django.urls import path
from chat.consumers import ChatConsumer, ConversationConsumer
from notifications.consumers import NotificationConsumer 

websocket_urlpatterns = [
    path('ws/chat/<int:seller_id>/', ChatConsumer.as_asgi()),
    path('ws/chat/conv/<int:conversation_id>/', ConversationConsumer.as_asgi()),
    path('ws/updates/<int:user_id>/', NotificationConsumer.as_asgi()),
]