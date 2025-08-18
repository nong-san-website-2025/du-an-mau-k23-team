from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    is_seller = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)  # Quyền admin
    is_support = models.BooleanField(default=False)  # Quyền hỗ trợ
    is_locked = models.BooleanField(default=False)  # Khóa tài khoản  # Quyền nhân viên
    full_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='assets/users/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    last_activity = models.DateTimeField(blank=True, null=True)  # Lịch sử hoạt động
    note = models.TextField(blank=True, null=True)  # Ghi chú admin
    tags = models.CharField(max_length=255, blank=True, null=True)  # Tag: shop nổi bật, shop yêu thích
    reset_code = models.CharField(max_length=6, blank=True, null=True)
    points = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        # Nếu user là superuser thì tự động set is_admin=True
        if self.is_superuser:
            self.is_admin = True
        super().save(*args, **kwargs)
    def __str__(self):
        return self.username


    # Model lưu lịch sử tích điểm
    

class Address(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="addresses")
    recipient_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    location = models.TextField()
    is_default = models.BooleanField(default=False, blank=True, null=True)  # Cho phép để trống

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.recipient_name} - {self.location}"
class PointHistory(models.Model):
        user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="point_histories")
        order_id = models.CharField(max_length=50, blank=True, null=True)
        points = models.IntegerField()
        amount = models.IntegerField()  # số tiền đơn hàng
        date = models.DateTimeField(auto_now_add=True)
        action = models.CharField(max_length=255, default="Cộng điểm khi mua hàng")

        def __str__(self):
            return f"{self.user.username} - {self.points} điểm - {self.date}"


