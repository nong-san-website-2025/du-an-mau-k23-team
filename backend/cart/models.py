from django.db import models
from django.conf import settings
from products.models import Product
import uuid

class Cart(models.Model):
    # Nếu user đăng nhập thì lưu user, nếu guest thì lưu session_key
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='cart'
    )
    session_key = models.CharField(default=uuid.uuid4, max_length=100, null=True, blank=True)  # thêm để lưu guest
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # tránh trùng lặp: 1 user có 1 cart, 1 session_key có 1 cart
        unique_together = (
            ('user',),
            ('session_key',),
        )

    def __str__(self):
        return f"Cart của {self.user.username if self.user else self.session_key}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product')

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
