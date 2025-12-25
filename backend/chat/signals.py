# chat/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Message
from products.models import Product  # Thay đổi 'products' nếu tên app của bạn khác
from products.serializers import ProductSerializer #

@receiver(post_save, sender=Message)
def send_message_to_socket(sender, instance, created, **kwargs):
    """
    Khi một tin nhắn được lưu vào DB (dù qua API hay Admin), 
    tự động bắn tín hiệu sang WebSocket Group.
    """
    if created:
        channel_layer = get_channel_layer()
        conversation_id = instance.conversation.id
        group_name = f'chat_{conversation_id}'

        # Chuẩn bị dữ liệu gửi đi
        message_data = {
            "id": instance.id,
            "conversation": conversation_id,
            "sender": instance.sender.id,
            "content": instance.content,
            "image": instance.image.url if instance.image else None,
            "is_read": instance.is_read,
            "created_at": instance.created_at.isoformat(),
        }

        # Gửi vào Group chat (Consumer sẽ nhận được ở hàm chat_message)
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.message", # Tên hàm trong Consumer
                "message": message_data
            }
        )
# --- THÊM LOGIC CHO PRODUCT TẠI ĐÂY ---
@receiver(post_save, sender=Product)
def send_product_update_to_admin(sender, instance, created, **kwargs):
    """
    Khi có sản phẩm mới hoặc cập nhật, bắn tín hiệu cho Admin Approval.
    """
    channel_layer = get_channel_layer()
    
    # 1. Xác định hành động (CREATE cho sp mới, UPDATE cho sp chỉnh sửa)
    action = "CREATE" if created else "UPDATE"
    
    # 2. Serialize dữ liệu (Dữ liệu này sẽ đẩy trực tiếp lên bảng Admin)
    # Lưu ý: Serializer này nên có đủ thông tin Seller, Category... để Admin không cần load lại
    serializer = ProductSerializer(instance)
    
    # 3. Gửi vào group "admin_products" (phải khớp với ProductApprovalConsumer)
    async_to_sync(channel_layer.group_send)(
        "admin_products",
        {
            "type": "product_update", # Gọi đến hàm async def product_update trong Consumer
            "action": action,
            "data": serializer.data,
        }
    )
    print(f"📡 [WS] Đã bắn tín hiệu {action} cho sản phẩm: {instance.name}")