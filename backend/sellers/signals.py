from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from sellers.models import Product, SellerActivityLog
from sellers.models import Seller

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