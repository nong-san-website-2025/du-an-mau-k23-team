from django.db import models
from users.models import CustomUser
from products.models import Product

class Cart(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)

<<<<<<< HEAD
    def __str__(self):
        return f"Cart của {self.user.username}"


=======


    def __str__(self):
        return f"Cart của {self.user.username}"
>>>>>>> feature/backend_cart_NhatNguyen
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
<<<<<<< HEAD

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
=======
    image = models.ImageField(upload_to='cart_items/', blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['cart', 'product']

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
>>>>>>> feature/backend_cart_NhatNguyen
