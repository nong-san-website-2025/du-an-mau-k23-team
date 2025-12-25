from django.db import models
from products.models import Product
from users.models import CustomUser
from django.db.models.signals import post_save, post_delete
from django.db.models import Avg, Count
from django.dispatch import receiver

# -------------------- ĐÁNH GIÁ SẢN PHẨM --------------------
class Review(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField()
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    is_hidden = models.BooleanField(default=False)  # Admin can hide inappropriate reviews

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['product', 'user'], name='unique_review_per_user')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}⭐)"

# --- [MỚI] MODEL LƯU ẢNH ĐÁNH GIÁ ---
class ReviewImage(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="reviews/images/")
    
    def __str__(self):
        return f"Image for review {self.review.id}"


# -------------------- TRẢ LỜI ĐÁNH GIÁ --------------------
class ReviewReply(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="replies")
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)  # admin/shop/user đều có thể reply
    reply_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.user.username} on Review {self.review.id}"


# -------------------- KHIẾU NẠI & HỖ TRỢ --------------------
class CustomerSupport(models.Model):
    ISSUE_CHOICES = [
        ("complaint", "Khiếu nại"),
        ("inquiry", "Hỏi đáp"),
        ("feedback", "Phản hồi"),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    issue_type = models.CharField(max_length=20, choices=ISSUE_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.issue_type} - {'Đã xử lý' if self.is_resolved else 'Chưa xử lý'}"


# -------------------- SIGNALS: TỰ ĐỘNG CẬP NHẬT RATING --------------------
@receiver([post_save, post_delete], sender=Review)
def update_product_rating(sender, instance, **kwargs):
    product = instance.product
    agg = product.reviews.aggregate(avg=Avg("rating"), count=Count("id"))
    product.rating = agg["avg"] or 0
    product.review_count = agg["count"]
    product.save()