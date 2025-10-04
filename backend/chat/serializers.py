from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_avatar = serializers.ImageField(source="sender.avatar", read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "content", "image", "is_read", "created_at", "sender_avatar"]
        # conversation & sender are set in the view (perform_create), so keep them read-only for clients
        read_only_fields = ["id", "is_read", "created_at", "conversation", "sender"]


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)
    seller_image = serializers.ImageField(source="seller.image", read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "user", "seller", "created_at", "updated_at", "last_message_at", "last_message", "seller_name", "seller_image"]
        read_only_fields = ["id", "created_at", "updated_at", "last_message_at"]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        return MessageSerializer(msg).data if msg else None