from django.db import models
from orders.models import Order
from django.conf import settings
from sellers.models import Seller

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

class SellerWallet(models.Model):
    seller = models.OneToOneField(Seller, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pending_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    last_pending_approved_at = models.DateTimeField(null=True, blank=True, help_text="Thời gian pending_balance được duyệt cuối cùng")
    updated_at = models.DateTimeField(auto_now=True, null=True)  

class WalletTransaction(models.Model):
    wallet = models.ForeignKey(SellerWallet, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=20, choices=[
        ('pending_add', 'Pending Add'),
        ('add', 'Add Balance'),
        ('deduct', 'Deduct Balance'),
        ('withdraw', 'Withdraw'),
    ])
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
