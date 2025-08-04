from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    is_seller = models.BooleanField(default=False)
    full_name = models.CharField(max_length=255, blank=True, null=True)  # optional field for full name
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='assets/users/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.username
    
    reset_code = models.CharField(max_length=6, blank=True, null=True)

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


