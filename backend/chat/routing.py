from django.urls import path, re_path # Thêm re_path nếu muốn dùng regex
from chat.consumers import (
    ChatConsumer, 
    ConversationConsumer, 
    SellerApprovalConsumer, 
    SellerBusinessConsumer, 
    ProductApprovalConsumer
)
from notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    path('ws/chat/<int:seller_id>/', ChatConsumer.as_asgi()),
    path('ws/chat/conv/<int:conversation_id>/', ConversationConsumer.as_asgi()),
    path('ws/updates/<int:user_id>/', NotificationConsumer.as_asgi()),
    path('ws/sellers/approval/', SellerApprovalConsumer.as_asgi()),
    path('ws/sellers/business/', SellerBusinessConsumer.as_asgi()),
    
    # Sửa dòng này: Bỏ dấu $ nếu dùng path, hoặc đổi sang re_path
    # Thêm 'api/' vào đầu nếu bạn muốn khớp với URL ở Frontend cũ
    path('api/ws/admin/products/', ProductApprovalConsumer.as_asgi()),
]