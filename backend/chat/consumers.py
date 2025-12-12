import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from urllib.parse import parse_qs

from .models import Conversation, Message
from sellers.models import Seller

User = get_user_model()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Expect path: /ws/chat/<seller_id>/
        self.seller_id = self.scope['url_route']['kwargs']['seller_id']
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.room_group_name = f"chat_seller_{self.seller_id}_user_{self.user.id}"

        # Ensure conversation exists
        await self.get_or_create_conversation()

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Expect payload: {"type":"message", "content":"..."}
        msg_type = content.get("type")
        if msg_type == "message":
            text = content.get("content", "").strip()
            if text:
                message_data = await self.create_message(text)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "message": message_data,
                    },
                )

    async def chat_message(self, event):
        await self.send_json({"event": "message", "data": event["message"]})

    # DB helpers
    @database_sync_to_async
    def get_or_create_conversation(self):
        seller = Seller.objects.get(pk=self.seller_id)
        conv, _ = Conversation.objects.get_or_create(user=self.user, seller=seller)
        return conv

    @database_sync_to_async
    def create_message(self, text: str):
        seller = Seller.objects.get(pk=self.seller_id)
        conv, _ = Conversation.objects.get_or_create(user=self.user, seller=seller)
        msg = Message.objects.create(conversation=conv, sender=self.user, content=text)
        conv.last_message_at = msg.created_at
        conv.save(update_fields=["last_message_at"])
        return {
            "id": msg.id,
            "conversation": conv.id,
            "sender": self.user.id,
            "content": msg.content,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat(),
        }


class ConversationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Expect path: /ws/chat/conv/<conversation_id>/
        self.conversation_id = int(self.scope['url_route']['kwargs']['conversation_id'])
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Permission check: user must be member of conversation
        is_member = await self.user_in_conversation(self.conversation_id, self.user.id)
        if not is_member:
            await self.close(code=4003)
            return

        self.room_group_name = f"chat_conv_{self.conversation_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")
        if msg_type == "message":
            text = content.get("content", "").strip()
            if text:
                message_data = await self.create_message(self.conversation_id, text)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "message": message_data,
                    },
                )

    async def chat_message(self, event):
        await self.send_json({"event": "message", "data": event["message"]})

    # DB helpers
    @database_sync_to_async
    def user_in_conversation(self, conv_id: int, user_id: int) -> bool:
        try:
            conv = Conversation.objects.select_related("user", "seller__user").get(id=conv_id)
        except Conversation.DoesNotExist:
            return False
        return conv.user_id == user_id or (getattr(conv.seller, "user_id", None) == user_id)

    @database_sync_to_async
    def create_message(self, conv_id: int, text: str):
        conv = Conversation.objects.get(id=conv_id)
        msg = Message.objects.create(conversation=conv, sender=self.user, content=text)
        conv.last_message_at = msg.created_at
        conv.save(update_fields=["last_message_at"])
        return {
            "id": msg.id,
            "conversation": conv.id,
            "sender": self.user.id,
            "content": msg.content,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat(),
        }