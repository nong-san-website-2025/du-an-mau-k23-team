from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class SearchLog(models.Model):
    keyword = models.CharField(max_length=255, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.keyword} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
