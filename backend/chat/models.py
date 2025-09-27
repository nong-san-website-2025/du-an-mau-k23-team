from django.db import models
from django.conf import settings
from django.utils import timezone

# We will use sellers.Seller as the shop entity
class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations")
    seller = models.ForeignKey("sellers.Seller", on_delete=models.CASCADE, related_name="conversations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("user", "seller")
        ordering = ("-last_message_at",)

    def __str__(self) -> str:
        return f"Conversation u{self.user_id}-s{self.seller_id}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    # Allow empty text when sending image-only messages
    content = models.TextField(blank=True, default="")
    # Optional image attachment
    image = models.ImageField(upload_to="chat_images/", null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"Msg {self.id} in conv {self.conversation_id} by {self.sender_id}"