from django.db import models
from users.models import CustomUser

class Seller(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    store_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.store_name