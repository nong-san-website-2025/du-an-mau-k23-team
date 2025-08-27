from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)  # "admin", "seller", "employee", "customer", "support"

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):

    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True,default="customer" )

    full_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='assets/users/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    last_activity = models.DateTimeField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    points = models.IntegerField(default=0)

    STATUS_CHOICES = (
        ('active', 'Đang hoạt động'),
        ('inactive', 'Ngừng hoạt động'),
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
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
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

    # 👇 Các property này mặc định False nếu không phải role tương ứng
    @property
    def is_admin(self):
        return self.is_superuser or (self.role and self.role.name == "admin")

    @property
    def is_seller(self):
        return self.role and self.role.name == "seller"

    


class Address(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="addresses")
    recipient_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    location = models.TextField()
    is_default = models.BooleanField(default=False)

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
