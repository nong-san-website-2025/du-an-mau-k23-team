from django.db import models
from django.conf import settings    
import unicodedata
class Category(models.Model):
    name = models.CharField(max_length=100, db_index=True)
    key = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="active")
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    commission_rate = models.FloatField(default=0.05)  # 5% mặc định
    icon = models.ImageField(upload_to='categories/icons/', null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.subcategories.count()} danh mục con)"

class Subcategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="active")
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"


class Product(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("banned", "Banned"),
        ("hidden", "Hidden"),
        ('pending_update', 'Chờ duyệt cập nhật'),
    ]

    AVAILABILITY_CHOICES = [
        ("available", "Có sẵn"),
        ("coming_soon", "Sắp có"),
    ]

    UNIT_CHOICES = [
        ("kg", "Kilogram"),
        ("g", "Gram"),
        ("l", "Lít"),
        ("ml", "Milliliter"),
        ("unit", "Cái / Chiếc"),
    ]


    seller = models.ForeignKey("sellers.Seller", on_delete=models.CASCADE, related_name="products")
    subcategory = models.ForeignKey(Subcategory, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    name = models.CharField(max_length=255, db_index=True)
    normalized_name = models.CharField(max_length=255, blank=True, db_index=True)

    description = models.TextField()
    original_price = models.DecimalField(max_digits=10, decimal_places=0)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default="kg")
    stock = models.PositiveIntegerField(default=0)
    sold = models.IntegerField(default=0, blank=True)

    image = models.ImageField(upload_to='products/', blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    review_count = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    estimated_quantity = models.PositiveIntegerField(default=10)  # Số lượng dự kiến có thể đặt trước
    ordered_quantity = models.PositiveIntegerField(default=0) 
    # Visibility and status
    is_hidden = models.BooleanField(default=False)
    status = models.CharField(  # trạng thái kiểm duyệt (admin)
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    availability_status = models.CharField(  # trạng thái seller chọn
        max_length=20,
        choices=AVAILABILITY_CHOICES,
        default="available",
    )

    season_start = models.DateField(null=True, blank=True)
    season_end = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        self.normalized_name = unicodedata.normalize('NFD', self.name)
        self.normalized_name = ''.join(ch for ch in self.normalized_name if unicodedata.category(ch) != 'Mn')
        self.normalized_name = self.normalized_name.lower().strip()
        super().save(*args, **kwargs)

    @property
    def discount_percent(self):
        """Tính phần trăm giảm giá từ giá gốc và giá giảm"""
        if self.original_price and self.discounted_price:
            try:
                discount = 100 * (1 - self.discounted_price / self.original_price)
                return round(discount, 2)
            except Exception:
                return 0
        return 0

    @property
    def preordered_quantity(self):
        """
        Tính tổng số lượng khách đã đặt trước cho sản phẩm này
        (áp dụng với trạng thái coming_soon).
        """
        return sum(item.quantity for item in self.order_items.all())
    

    @property
    def sold_quantity(self):
        from orders.models import OrderItem
        total = OrderItem.objects.filter(product=self).aggregate(models.Sum("quantity"))["quantity__sum"]
        return total or 0
    
    @property
    def preordered_quantity(self):
        """Tổng số lượng đặt trước cho sản phẩm này (chưa bị hủy)"""
        total = self.preorders.filter(status="pending").aggregate(models.Sum("quantity"))["quantity__sum"]
        return total or 0



class ProductFeature(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="features")
    name = models.CharField(max_length=50)

class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='products/gallery/')
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.product.name} - Image {self.id}"


class PendingProductUpdate(models.Model):
    """
    Model lưu trữ các yêu cầu cập nhật sản phẩm đang chờ duyệt từ admin
    """
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='pending_update')
    # Dữ liệu mới được đề xuất
    name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    original_price = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    unit = models.CharField(max_length=10, blank=True)
    stock = models.PositiveIntegerField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    availability_status = models.CharField(max_length=20, blank=True)
    season_start = models.DateField(null=True, blank=True)
    season_end = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pending update for {self.product.name}"

    def apply_changes(self):
        """
        Áp dụng các thay đổi vào sản phẩm và xóa pending update
        """
        product = self.product
        # Chỉ cập nhật các field không blank
        if self.name:
            product.name = self.name
        if self.description:
            product.description = self.description
        if self.original_price is not None:
            product.original_price = self.original_price
        if self.discounted_price is not None:
            product.discounted_price = self.discounted_price
        if self.unit:
            product.unit = self.unit
        if self.stock is not None:
            product.stock = self.stock
        if self.location:
            product.location = self.location
        if self.brand:
            product.brand = self.brand
        if self.availability_status:
            product.availability_status = self.availability_status
        if self.season_start is not None:
            product.season_start = self.season_start
        if self.season_end is not None:
            product.season_end = self.season_end

        product.status = 'approved'
        product.is_hidden = False
        product.save()
        self.delete()


# class Preorder(models.Model):
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name="preorders"
#     )
#     product = models.ForeignKey(
#         Product,
#         on_delete=models.CASCADE,
#         related_name="preorders"  # 👈 thêm dòng này
#     )
#     quantity = models.PositiveIntegerField()
#     created_at = models.DateTimeField(auto_now_add=True)
