from django.db import models
from django.conf import settings
from orders.models import OrderItem # Import từ app orders

class Complaint(models.Model):
    # Các trạng thái theo quy trình tranh chấp chuẩn
    STATUS_CHOICES = [
        ("pending", "Chờ người bán phản hồi"),    
        ("negotiating", "Đang thương lượng"),     
        ("admin_review", "Sàn đang xem xét"),     
        ("resolved_refund", "Đã hoàn tiền"),      
        ("resolved_reject", "Từ chối hoàn tiền"), 
        ("cancelled", "Đã hủy khiếu nại"),        
    ]

    # QUAN TRỌNG: Liên kết với OrderItem thay vì Product
    # Để biết chính xác khách kiện món nào, giá bao nhiêu tại thời điểm mua
    # Thêm null=True vào
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name="complaints", null=True)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaints"
    )
    
    # Lý do khiếu nại
    reason = models.TextField()
    
    # Phản hồi của Seller
    seller_response = models.TextField(blank=True, null=True)
    
    # Phán quyết của Admin
    admin_notes = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Complaint #{self.id} - {self.user.username} - Item: {self.order_item.product.name}"

# Tách riêng bảng Media để 1 khiếu nại có thể up nhiều ảnh/video
class ComplaintMedia(models.Model):
    complaint = models.ForeignKey(
        Complaint, 
        related_name='media', # Để query ngược: complaint.media.all()
        on_delete=models.CASCADE
    )
    # Lưu file (ảnh/video)
    file = models.FileField(upload_to="complaints/%Y/%m/%d/") 
    
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Media for Complaint #{self.complaint.id}"