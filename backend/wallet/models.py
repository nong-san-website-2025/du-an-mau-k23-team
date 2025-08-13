from django.db import models
from users.models import CustomUser


class WalletRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('approved', 'Đã xác nhận'),
        ('rejected', 'Đã từ chối'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='wallet_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='processed_wallet_requests'
    )
    admin_note = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Yêu cầu nạp tiền'
        verbose_name_plural = 'Yêu cầu nạp tiền'
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} ₫ - {self.get_status_display()}"


class UserWallet(models.Model):
    """Model để lưu số dư ví của user"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.balance} ₫"
    
    class Meta:
        verbose_name = 'Ví điện tử'
        verbose_name_plural = 'Ví điện tử'