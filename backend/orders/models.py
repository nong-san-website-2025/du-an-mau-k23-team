from django.db import models
from django.utils import timezone
from products.models import Product
from users.models import CustomUser
from django.conf import settings
from promotions.models import Voucher 

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
    # 1. Trạng thái Vận đơn (Order Status)
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),      # Mới đặt, chưa làm gì
        ('confirmed', 'Đã xác nhận'),     # Seller đã nhận đơn
        ('shipping', 'Đang vận chuyển'),  # Đã giao cho Shipper
        ('delivered', 'Đã giao hàng'),    # Shipper báo giao thành công
        ('completed', 'Hoàn thành'),      # Đã đối soát xong/Hết hạn khiếu nại
        ('cancelled', 'Đã hủy'),
        ('returned', 'Trả hàng/Hoàn tiền'), 
    ]

    # 2. [MỚI] Trạng thái Thanh toán (Payment Status) - Tách biệt hoàn toàn
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Chưa thanh toán'),
        ('paid', 'Đã thanh toán'),
        ('refunded', 'Đã hoàn tiền'),     # Dùng cho trường hợp hủy đơn đã trả trước
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="orders")
    
    # Thông tin người nhận
    customer_name = models.CharField(max_length=255, null=True, blank=True, default="")
    customer_phone = models.CharField(max_length=20, null=True, blank=True, default="")
    address = models.CharField(max_length=255, null=True, blank=True, default="")
    note = models.TextField(blank=True, null=True, default="")
    
    # Thông tin địa lý GHN (để thống kê khu vực)
    province_id = models.IntegerField(null=True, blank=True, help_text='GHN ProvinceID')
    district_id = models.IntegerField(null=True, blank=True, help_text='GHN DistrictID')
    ward_code = models.CharField(max_length=20, null=True, blank=True, help_text='GHN WardCode')
    
    # Tài chính & Thanh toán
    payment_method = models.CharField(max_length=50, default="Thanh toán khi nhận hàng (COD)", null=True, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    transaction_id = models.CharField(max_length=100, null=True, blank=True, help_text="Mã giao dịch từ VNPAY/Momo/Ngân hàng")
    paid_at = models.DateTimeField(null=True, blank=True, help_text="Thời điểm thanh toán thành công")

    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Trạng thái & Logic
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    
    # Cờ đánh dấu đơn hàng đang có tranh chấp (khiếu nại 1 phần hoặc toàn bộ)
    is_disputed = models.BooleanField(default=False) 
    
    stock_deducted = models.BooleanField(default=False)
    sold_counted = models.BooleanField(default=False)

    voucher = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Soft Delete & Timestamp
    is_deleted = models.BooleanField(default=False)
    # [TỐI ƯU] db_index=True giúp sort và filter theo ngày cực nhanh
    created_at = models.DateTimeField(auto_now_add=True, db_index=True) 
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Giao hàng (Tích hợp GHN/GHTK)
    ghn_order_code = models.CharField(max_length=64, null=True, blank=True, unique=True)

    objects = OrderManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ['-created_at'] # Mặc định lấy đơn mới nhất trước
        indexes = [
            models.Index(fields=['status', 'created_at']), # Tối ưu query lọc theo trạng thái + ngày
        ]
    
    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    def __str__(self):
        return f"Order #{self.id} | {self.customer_name} | {self.get_status_display()} | {self.get_payment_status_display()}"

class OrderItem(models.Model):
    # Trạng thái chi tiết cho từng sản phẩm (Phục vụ hoàn tiền 1 phần)
    ITEM_STATUS_CHOICES = [
        ('NORMAL', 'Bình thường'),
        ('REFUND_REQUESTED', 'Yêu cầu hoàn tiền'),
        
        # --- [THÊM 2 DÒNG NÀY] ---
        ('WAITING_RETURN', 'Chờ trả hàng'),   # Shop đồng ý, đợi khách gửi
        ('RETURNING', 'Đang trả hàng về'),    # Khách đã gửi, đang vận chuyển
        # -------------------------
        
        ('SELLER_REJECTED', 'Người bán từ chối'), 
        ('DISPUTE_TO_ADMIN', 'Khiếu nại lên Sàn'), 
        ('REFUND_APPROVED', 'Đồng ý hoàn tiền'), 
        ('REFUND_REJECTED', 'Từ chối hoàn tiền'), 
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items")
    
    # Snapshot thông tin sản phẩm
    product_image = models.URLField(max_length=500, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Trạng thái item
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