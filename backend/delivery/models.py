from django.db import models


class GHNWebhookLog(models.Model):
    """Store raw GHN webhook payloads for debugging/idempotency."""
    raw_payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"GHNWebhookLog #{self.id} at {self.created_at:%Y-%m-%d %H:%M:%S}"