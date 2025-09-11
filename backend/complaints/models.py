from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

class Complaint(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaints"
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="complaints"
    )
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    RESOLUTION_CHOICES = (
    ('refund_full', 'Hoàn tiền toàn bộ'),
    ('refund_partial', 'Hoàn tiền một phần'),
    ('replace', 'Đổi sản phẩm'),
    ('voucher', 'Tặng voucher/điểm thưởng'),
    ('reject', 'Từ chối khiếu nại'),
    )
    resolution_type = models.CharField(max_length=30, choices=RESOLUTION_CHOICES, null=True, blank=True)


    def __str__(self):
        return f"{self.user} - {self.product} ({self.status})"

class ComplaintMedia(models.Model):
    complaint = models.ForeignKey(
        Complaint, related_name='media', on_delete=models.CASCADE
    )
    file = models.FileField(upload_to="complaints/")  # hoặc ImageField nếu chỉ ảnh

    def __str__(self):
        return str(self.file)
