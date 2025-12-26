# chat/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Message

@receiver(post_save, sender=Message)
def send_message_to_socket(sender, instance, created, **kwargs):
    """
    Khi một tin nhắn được lưu vào DB, tự động bắn tín hiệu sang WebSocket Group.
    """
    if created:
        channel_layer = get_channel_layer()
        conversation_id = instance.conversation.id
        group_name = f'chat_{conversation_id}'

        # Chuẩn bị dữ liệu (Message thường không có Decimal nên gửi trực tiếp OK)
        # Nếu sau này Message có Decimal, nhớ dùng make_json_safe nhé!
        message_data = {
            "id": instance.id,
            "conversation": conversation_id,
            "sender": instance.sender.id,
            "content": instance.content,
            "image": instance.image.url if instance.image else None,
            "is_read": instance.is_read,
            "created_at": instance.created_at.isoformat(),
        }

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.message",
                "message": message_data
            }
        )