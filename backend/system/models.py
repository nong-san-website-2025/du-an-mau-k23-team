from django.db import models

class SystemConfig(models.Model):
    site_name = models.CharField(max_length=255, default="My Website")
    support_email = models.EmailField(default="support@example.com")
    maintenance_mode = models.BooleanField(default=False)

    def __str__(self):
        return self.site_name

class SystemLog(models.Model):
    action = models.CharField(max_length=255)
    user = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.user}"
