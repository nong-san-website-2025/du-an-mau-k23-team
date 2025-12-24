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
    
    # Nếu là tạo mới (created=True) hoặc cập nhật status
    action = "CREATED" if created else "UPDATED"
    
    # Dùng serializer để format dữ liệu giống hệt lúc Admin fetch API
    serializer = SellerListSerializer(instance)
    
    async_to_sync(channel_layer.group_send)(
        "admin_seller_approval", # Phải khớp với group_name ở Bước 1
        {
            "type": "send_approval_update",
            "content": {
                "action": action,
                "data": serializer.data
            }
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