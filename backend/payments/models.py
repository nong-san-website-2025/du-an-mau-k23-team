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
    wallet = models.ForeignKey(SellerWallet, on_delete=models.CASCADE, related_name='transactions') # Thêm related_name để query ngược cho dễ
    
    # Liên kết với Order để biết tiền này từ đơn nào (QUAN TRỌNG)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Loại giao dịch chi tiết
    TYPE_CHOICES = [
        ('deposit', 'Nạp tiền'),
        ('withdraw', 'Rút tiền'),
        ('pending_income', 'Doanh thu chờ duyệt'), # Mới: Khi đơn thành công, tiền vào pending
        ('sale_income', 'Doanh thu bán hàng'), # Khi admin duyệt, tiền vào balance
        ('refund_deduct', 'Trừ tiền hoàn hàng'), # Trừ tiền
        ('platform_fee', 'Phí sàn'), # Trừ tiền
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.wallet.seller} - {self.get_type_display()} - {self.amount}"