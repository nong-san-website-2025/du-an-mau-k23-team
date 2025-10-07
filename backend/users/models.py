from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)  # "admin", "seller", "employee", "customer", "support"

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):

    phone_regex = RegexValidator(
        regex=r'^0\d{9}$',
        message="Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số."
    )

    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='assets/users/', blank=True, null=True)
    phone = models.CharField(
        validators=[phone_regex],
        max_length=10,
        blank=True,
        null=True,
        unique=True
    )

    # Pending changes for secure verification flows
    pending_email = models.EmailField(null=True, blank=True)
    pending_phone = models.CharField(max_length=10, null=True, blank=True)
    phone_otp = models.CharField(max_length=6, null=True, blank=True)
    phone_otp_expires = models.DateTimeField(null=True, blank=True)

    last_activity = models.DateTimeField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    points = models.IntegerField(default=0)

    STATUS_CHOICES = (
        ('active', 'Đang hoạt động'),
        ('inactive', 'Ngừng hoạt động'),
        ('pending', "Chờ duyệt")
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='active',
        blank=True,
        null=True
    )

    def save(self, *args, **kwargs):
        # Nếu superuser thì auto gán role=admin
        if self.is_superuser and (not self.role or self.role.name != "admin"):
            admin_role, _ = Role.objects.get_or_create(name="admin")
            self.role = admin_role
        # Nếu user thường chưa có role thì gán mặc định là "customer"
        if not self.role and not self.is_superuser:
            customer_role, _ = Role.objects.get_or_create(name="customer")
            self.role = customer_role
        # Nếu chưa có status thì gán mặc định là "active"
        if not self.status:
            self.status = 'active'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

    @property
    def is_admin(self):
        """Xác định người dùng có quyền admin.
        - True nếu là superuser hoặc có role tên 'admin'.
        """
        return bool(self.is_superuser or (self.role and self.role.name == "admin"))


# models.py
class Address(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="addresses")
    recipient_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    location = models.TextField()  # Địa chỉ cụ thể (số nhà, đường...)

    # Cờ địa chỉ mặc định
    is_default = models.BooleanField(default=False)

    # Thông tin GHN
    district_id = models.IntegerField(
        null=True, blank=True, help_text='GHN DistrictID (bắt buộc nếu tính phí GHN)'
    )
    ward_code = models.CharField(
        max_length=20, null=True, blank=True, help_text='GHN WardCode (bắt buộc nếu tính phí GHN)'
    )

    # Mã nội bộ (tuỳ ý)
    province_code = models.CharField(max_length=10, null=True, blank=True)
    district_code = models.CharField(max_length=10, null=True, blank=True)

    def save(self, *args, **kwargs):
        # Nếu set is_default = True -> các địa chỉ khác của user phải về False
        if self.is_default:
            Address.objects.filter(user=self.user).exclude(id=self.id).update(is_default=False)
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


class Notification(models.Model):
    """
    Model to store user notifications
    """
    TYPE_CHOICES = (
        ('order_created', 'Đơn hàng mới'),
        ('order_status_changed', 'Cập nhật đơn hàng'),
        ('review_reply', 'Phản hồi đánh giá'),
        ('complaint', 'Khiếu nại'),
        ('wallet', 'Ví tiền'),
        ('voucher', 'Voucher'),
        ('system', 'Hệ thống'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField()
    detail = models.TextField(blank=True, null=True)
    
    # Metadata (JSON format for flexible data)
    metadata = models.JSONField(blank=True, null=True, help_text="Additional data like order_id, status, etc.")
    
    # Read status
    is_read = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title} - {self.created_at}"
