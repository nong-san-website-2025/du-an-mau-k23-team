from django.db import models
class Category(models.Model):
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=50, unique=True)
    icon = models.CharField(max_length=50, default='Package')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="active")
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    
    def __str__(self):
        return self.name

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
        ("self_rejected", "Self Rejected"),
        ("banned", "Banned"),
    ]

    AVAILABILITY_CHOICES = [
        ("available", "Có sẵn"),
        ("coming_soon", "Sắp có"),
    ]

    seller = models.ForeignKey("sellers.Seller", on_delete=models.CASCADE, related_name="products")
    subcategory = models.ForeignKey(Subcategory, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, default='kg')
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    review_count = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    estimated_quantity = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.name

    @property
    def discounted_price(self):
        try:
            if getattr(self, "discount", 0) > 0:
                return self.price * (100 - getattr(self, "discount", 0)) / 100
        except Exception:
            pass
        return self.price

    @property
    def preordered_quantity(self):
        """
        Tính tổng số lượng khách đã đặt trước cho sản phẩm này
        (áp dụng với trạng thái coming_soon).
        """
        return sum(item.quantity for item in self.order_items.all())


class ProductFeature(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="features")
    name = models.CharField(max_length=50)