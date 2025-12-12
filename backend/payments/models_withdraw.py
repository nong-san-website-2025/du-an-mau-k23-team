from django.db import models
from sellers.models import Seller

class WithdrawRequest(models.Model):
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="withdraw_requests")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default="pending")  # pending, approved, rejected, paid
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.seller.store_name} - {self.amount} - {self.status}"
