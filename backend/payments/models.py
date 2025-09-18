from django.db import models
from orders.models import Order

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    vnp_response_code = models.CharField(max_length=10, blank=True, null=True)
    vnp_transaction_no = models.CharField(max_length=100, blank=True, null=True)
    order_data = models.JSONField(null=True, blank=True)  # lưu giỏ hàng
