from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SystemLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)   # ví dụ: "login", "delete user"
    detail = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.created_at}] {self.user} - {self.action}"
