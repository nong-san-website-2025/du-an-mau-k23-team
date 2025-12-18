from django.db import models
from django.utils import timezone
from products.models import Product
from users.models import CustomUser
from django.conf import settings
# Nếu bạn dùng PostgreSQL thì dùng JSONField để lưu danh sách ảnh bằng chứng, 
# nếu không thì dùng TextField rồi split chuỗi.
# from django.contrib.postgres.fields import ArrayField 

# --- CART SYSTEM (Giữ nguyên) ---
class Cart(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="orders_cart")
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="orders_cart_items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders_cart_items")
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

# --- ORDER SYSTEM ---

class OrderManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def deleted(self):
        return super().get_queryset().filter(is_deleted=True)
    
    def all_with_deleted(self):
        return super().get_queryset()

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('shipping', 'Đang vận chuyển'),
        ('delivered', 'Đã giao hàng'),
        ('completed', 'Hoàn thành'), # Đã đối soát xong, không còn khiếu nại
        ('cancelled', 'Đã hủy'),
        ('returned', 'Trả hàng/Hoàn tiền'), # Áp dụng nếu trả toàn bộ đơn
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="orders")
    customer_name = models.CharField(max_length=255, null=True, blank=True, default="")
    customer_phone = models.CharField(max_length=20, null=True, blank=True, default="")
    address = models.CharField(max_length=255, null=True, blank=True, default="")
    note = models.TextField(blank=True, null=True, default="")
    payment_method = models.CharField(max_length=50, default="Thanh toán khi nhận hàng", null=True, blank=True)
    
    # Tài chính
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Trạng thái & Logic
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    
    # [MỚI] Cờ đánh dấu đơn hàng đang có tranh chấp (khiếu nại 1 phần hoặc toàn bộ)
    # Khi field này = True, hệ thống KHÔNG được giải ngân tiền cho Seller.
    is_disputed = models.BooleanField(default=False) 
    
    stock_deducted = models.BooleanField(default=False)
    sold_counted = models.BooleanField(default=False)
    
    # Soft Delete
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Giao hàng
    ghn_order_code = models.CharField(max_length=64, null=True, blank=True, unique=True)

    objects = OrderManager()
    all_objects = models.Manager()
    
    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    def __str__(self):
        return f"Order #{self.id} - {self.customer_name} - {self.status}"

class OrderItem(models.Model):
    # [MỚI] Trạng thái chi tiết cho từng sản phẩm
    ITEM_STATUS_CHOICES = [
        ('NORMAL', 'Bình thường'),
        ('REFUND_REQUESTED', 'Yêu cầu hoàn tiền'),
        ('SELLER_REJECTED', 'Người bán từ chối'), # Chờ người mua phản hồi
        ('DISPUTE_TO_ADMIN', 'Khiếu nại lên Sàn'), # Đang chờ Admin xử lý
        ('REFUND_APPROVED', 'Đồng ý hoàn tiền'), # Kết thúc: Tiền về Buyer
        ('REFUND_REJECTED', 'Từ chối hoàn tiền'), # Kết thúc: Tiền về Seller
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items")
    
    # Thông tin snapshot (lưu lại lúc đặt hàng để tránh sản phẩm bị sửa giá sau này)
    product_image = models.URLField(max_length=500, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # [MỚI] Trạng thái item
    status = models.CharField(max_length=50, choices=ITEM_STATUS_CHOICES, default='NORMAL')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Item {self.product.name if self.product else 'Deleted'} in Order #{self.order.id}"


# --- PREORDER SYSTEM (Giữ nguyên) ---
class Preorder(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preorders'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='preorders'
    )
    quantity = models.PositiveIntegerField(default=1)
    preorder_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='pending')

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.quantity})"