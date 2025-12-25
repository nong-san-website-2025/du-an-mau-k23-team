from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from sellers.models import Product, SellerActivityLog
from sellers.models import Seller
from asgiref.sync import async_to_sync # 🟢 Bổ sung
from channels.layers import get_channel_layer # 🟢 Bổ sung

from .serializers import SellerListSerializer # Import serializer của bạn

@receiver(post_save, sender=Seller)
def notify_admin_new_seller(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()   
    serializer = SellerListSerializer(instance)
    
    action = "CREATED" if created else "UPDATED"
    payload = {
        "action": action,
        "data": serializer.data
    }
    
    if created or instance.status in ["pending", "approved", "rejected"]:
        async_to_sync(channel_layer.group_send)(
            "admin_seller_approval",
            {
                "type": "send_approval_update",
                "content": payload
            }
        )
    
    if instance.status in ["active", "locked"]:
        async_to_sync(channel_layer.group_send)(
            "seller_business",
            {
                "type": "seller_notification",
                "content": payload
            }
        )

@receiver(post_save, sender=Product)
def log_product_changes(sender, instance, created, **kwargs):
    if created:
        SellerActivityLog.objects.create(
            seller=instance.seller,
            action="add_product",
            description=f"Đã thêm sản phẩm: {instance.name}"
        )
    else:
        SellerActivityLog.objects.create(
            seller=instance.seller,
            action="update_product",
            description=f"Đã cập nhật sản phẩm: {instance.name}"
        )

@receiver(post_delete, sender=Product)
def log_product_deletion(sender, instance, **kwargs):
    SellerActivityLog.objects.create(
        seller=instance.seller,
        action="delete_product",
        description=f"Đã xóa sản phẩm: {instance.name}"
    )