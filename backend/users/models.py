from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    is_seller = models.BooleanField(default=False)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username
    
    reset_code = models.CharField(max_length=6, blank=True, null=True)

