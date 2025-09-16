# websockets/routing.py
from django.urls import re_path
from websockets.consumers import (
    orders_consumer,
    # cart_consumer,
    # payment_consumer,
    # chat_consumer,
    # flashsale_consumer,
)

websocket_urlpatterns = [
    re_path(r"ws/orders/$", orders_consumer.OrderConsumer.as_asgi()),
    # re_path(r"ws/cart/(?P<user_id>\d+)/$", cart_consumer.CartConsumer.as_asgi()),
    # re_path(r"ws/payment/$", payment_consumer.PaymentConsumer.as_asgi()),
    # re_path(r"ws/chat/(?P<conversation_id>\d+)/$", chat_consumer.ChatConsumer.as_asgi()),
    # re_path(r"ws/flashsale/$", flashsale_consumer.FlashSaleConsumer.as_asgi()),
]
