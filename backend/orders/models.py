from django.db import models
from django.utils import timezone
from products.models import Product
from users.models import CustomUser

# Thêm model Cart và CartItem để mỗi user có một giỏ hàng riêng
class Cart(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="orders_cart")
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="orders_cart_items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders_cart_items")
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

# Custom manager for soft delete
class OrderManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def deleted(self):
        return super().get_queryset().filter(is_deleted=True)
    
    def all_with_deleted(self):
        return super().get_queryset()

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('shipping', 'Shipping'),
        ('success', 'Success'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="orders")
    customer_name = models.CharField(max_length=255, null=True, blank=True, default="")
    customer_phone = models.CharField(max_length=20, null=True, blank=True, default="")
    address = models.CharField(max_length=255, null=True, blank=True, default="")
    note = models.TextField(blank=True, null=True, default="")
    payment_method = models.CharField(max_length=50, default="Thanh toán khi nhận hàng", null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    is_deleted = models.BooleanField(default=False)  # Soft delete field
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)  # Timestamp when deleted

    # Managers
    objects = OrderManager()  # Default manager excludes deleted orders
    all_objects = models.Manager()  # Manager that includes all orders
    
    def soft_delete(self):
        """Soft delete the order"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """Restore a soft deleted order"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    def __str__(self):
        return f"Order #{self.id} - {self.customer_name} - {self.get_status_display()}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items")
    product_image = models.URLField(max_length=500, blank=True, null=True)  # optional, for display only
    unit = models.CharField(max_length=50, blank=True, null=True)  # optional, for display only
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
