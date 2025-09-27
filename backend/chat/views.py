from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from sellers.models import Seller

# Realtime broadcast for REST-created messages
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # If user is a shop owner, list conversations for their seller profile
        seller = getattr(user, "seller", None)
        if seller:
            return Conversation.objects.filter(seller=seller).select_related("seller", "user")
        return Conversation.objects.filter(user=user).select_related("seller", "user")

    def create(self, request, *args, **kwargs):
        user = request.user
        seller_id = request.data.get("seller")
        seller = get_object_or_404(Seller, id=seller_id)
        conv, _ = Conversation.objects.get_or_create(user=user, seller=seller)
        serializer = self.get_serializer(conv)
        return Response(serializer.data)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        conversation_id = self.kwargs["conversation_id"]
        conv = get_object_or_404(Conversation, id=conversation_id)
        user = self.request.user
        if not (conv.user_id == user.id or getattr(user, "seller", None) == conv.seller):
            raise PermissionDenied("Bạn không có quyền truy cập cuộc hội thoại này")
        return Message.objects.filter(conversation=conv).select_related("sender")

    def perform_create(self, serializer):
        conversation_id = self.kwargs["conversation_id"]
        conv = get_object_or_404(Conversation, id=conversation_id)
        user = self.request.user
        if not (conv.user_id == user.id or getattr(user, "seller", None) == conv.seller):
            raise PermissionDenied("Bạn không có quyền gửi tin nhắn ở cuộc hội thoại này")
        msg = serializer.save(conversation=conv, sender=user)
        conv.last_message_at = msg.created_at
        conv.save(update_fields=["last_message_at"]) 

        # Broadcast to WS group so both buyer and seller receive it realtime
        try:
            channel_layer = get_channel_layer()
            group = f"chat_conv_{conv.id}"
            payload = {
                "type": "chat.message",
                "message": {
                    "id": msg.id,
                    "conversation": conv.id,
                    "sender": user.id,
                    "content": msg.content,
                    "image": getattr(msg.image, 'url', None),
                    "is_read": msg.is_read,
                    "created_at": msg.created_at.isoformat(),
                },
            }
            async_to_sync(channel_layer.group_send)(group, payload)
        except Exception:
            # Avoid breaking REST flow if WS not available
            pass