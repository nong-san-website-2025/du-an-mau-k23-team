import json
import traceback
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from urllib.parse import parse_qs

from .models import Conversation, Message
from sellers.models import Seller
from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer

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
        try:
            # Ép kiểu int để chắc chắn
            s_id = int(self.seller_id)
            seller = Seller.objects.get(pk=s_id)
            conv, _ = Conversation.objects.get_or_create(user=self.user, seller=seller)
            return conv
        except Exception as e:
            print(f"LỖI CHAT: {e}")
            return None

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
        self.user = self.scope.get("user")
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_conv_{self.conversation_id}'
        
        if self.user is None or self.user.is_anonymous:
            # Nếu khách không gửi được, hãy xem terminal có hiện dòng này không
            print(f"WS Reject: User Anonymous. Conv ID: {self.conversation_id}")
            await self.close(code=4001)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Khi khách/seller tắt trình duyệt hoặc ngắt kết nối
        if self.user.is_authenticated:
            await self.update_user_last_seen()
        
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    @database_sync_to_async
    def update_user_last_seen(self):
        # Cập nhật thời gian cuối cùng hoạt động vào DB
        User.objects.filter(pk=self.user.id).update(last_login=timezone.now())

    async def receive_json(self, content, **kwargs):
        msg_type = content.get('type')
        if msg_type == 'message':
            message_data = await self.create_message(self.conversation_id, content.get('content'))
            
            # 1. Gửi vào phòng chat hiện tại (như cũ)
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "chat.message", "message": message_data}
            )

            # 2. MỚI: Gửi thông báo cho Seller để cập nhật Sidebar real-time
            # Chúng ta sẽ gửi vào một group chung của User đó: f"user_updates_{user_id}"
            conversation = await self.get_conversation_obj(self.conversation_id)
            
            # Xác định ID người nhận (nếu mình là khách thì gửi cho seller và ngược lại)
            target_user_id = conversation.seller.user_id if self.user.id == conversation.user_id else conversation.user_id

            await self.channel_layer.group_send(
                f"user_updates_{target_user_id}",
                {
                    "type": "sidebar.update", # Tên hàm xử lý bên dưới
                    "data": {
                        "conversation_id": self.conversation_id,
                        "last_message": message_data['content'],
                        "sender_name": self.user.username,
                        "created_at": message_data['created_at']
                    }
                }
            )
        # --- HANDLERS ĐỂ GỬI VỀ CLIENT ---
    
    # consumers.py

    async def sidebar_update(self, event):
        await self.send_json({
            "event": "sidebar_refresh",
            "data": event["data"]
        })

    async def chat_message(self, event):
            # Gửi dữ liệu xuống trình duyệt của CẢ HAI bên
            await self.send_json({
                "event": "message",
                "data": event["message"]
            })
    async def chat_typing(self, event):
        # Gửi event typing về client
        await self.send_json({
            "event": "typing",
            "sender_id": event["sender_id"],
            "typing": event["typing"]
        })

    async def chat_read(self, event):
        # Gửi event read về client
        await self.send_json({
            "event": "read",
            "reader_id": event["reader_id"]
        })
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
    
    @database_sync_to_async
    def mark_messages_as_read(self, conv_id: int, user_id: int):
        # Logic: Tìm các tin nhắn trong cuộc hội thoại này 
        # mà NGƯỜI GỬI KHÔNG PHẢI LÀ user_id (tức là tin của đối phương)
        # và is_read = False -> Update thành True
        Message.objects.filter(
            conversation_id=conv_id,
            is_read=False
        ).exclude(sender_id=user_id).update(is_read=True)


    @database_sync_to_async
    def get_conversation_obj(self, conv_id):
        return Conversation.objects.select_related('seller').get(id=conv_id)

    async def sidebar_update(self, event):
        # Gửi tín hiệu xuống Client để Sidebar tự fetch lại hoặc chèn thêm dòng mới
        await self.send_json({
            "event": "sidebar_refresh",
            "data": event["data"]
        })

class SellerApprovalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Phải đặt group_name khớp với signal
        self.group_name = "admin_seller_approval" 
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Tên hàm này phải khớp với "type": "send_approval_update" trong Signal
    async def send_approval_update(self, event):
        await self.send(text_data=json.dumps(event["content"]))
class SellerBusinessConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "seller_business"
        # Tham gia vào nhóm nhận thông báo quản lý shop (Active/Lock)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def seller_notification(self, event):
        await self.send(text_data=json.dumps(event["content"]))

# backend/chat/consumers.py

class ProductApprovalConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        print(f"[ProductApprovalConsumer] Attempting connection for user: {self.user} (Authenticated: {getattr(self.user, 'is_authenticated', False)})")

        if not self.user or not self.user.is_authenticated:
            print(f"[ProductApprovalConsumer] Connection REJECTED - user not authenticated")
            await self.close(code=4001)
            return

        # Accept connection first to avoid "closed before established" if group_add takes time
        await self.accept()
        
        try:
            await self.channel_layer.group_add("admin_products", self.channel_name)
            print("✅ [ProductApprovalConsumer] Admin Product WS connected and added to group")
        except Exception as e:
            print(f"❌ [ProductApprovalConsumer] Error adding to group: {e}")
            # If group_add fails (e.g. Redis down), we might want to close or keep open but warn
            # For now, let's keep it open but log the error

    async def product_update(self, event):
        """
        Handle product updates sent by signals. The `chat.signals` sends
        payload with keys: `action` (CREATE/UPDATE) and `data` (serialized product).
        Map that to the frontend-friendly `type` values and forward via JSON.
        """
        action = event.get("action")
        data = event.get("data")

        if action == "CREATE":
            payload_type = "NEW_PRODUCT"
        else:
            payload_type = "UPDATE_PRODUCT"

        # log for debugging to confirm consumer received the signal
        print(f"[ProductApprovalConsumer] Received product_update action={action} id={data.get('id')}")

        try:
            await self.send_json({"type": payload_type, "data": data})
        except Exception as e:
            print("[ProductApprovalConsumer] ERROR sending json:")
            traceback.print_exc()


class AdminUserConsumer(AsyncJsonWebsocketConsumer):
    """
    Simple consumer for admin user events. Joins the `admin_users` group
    and forwards `user_update` events to connected admin clients.
    Signals (or other code) should use channel_layer.group_send(
        "admin_users", {"type": "user_update", "action": "CREATE|UPDATE|DELETE", "data": {...}})
    """
    async def connect(self):
        self.user = self.scope.get("user")

        print(f"[AdminUserConsumer] Attempting connection for user: {self.user} (Authenticated: {getattr(self.user, 'is_authenticated', False)})")

        if not self.user or not self.user.is_authenticated:
            print("[AdminUserConsumer] Reject connection - anonymous user")
            await self.close(code=4001)
            return

        # Accept first
        await self.accept()

        try:
            await self.channel_layer.group_add("admin_users", self.channel_name)
            print("✅ [AdminUserConsumer] Admin Users WS connected and added to group", "user=", getattr(self.user, 'id', None))
        except Exception as e:
            print(f"❌ [AdminUserConsumer] Error adding to group: {e}")
            traceback.print_exc()

    async def disconnect(self, close_code):
        print(f"[AdminUserConsumer] disconnect code={close_code} user={getattr(self.user, 'id', None)}")
        try:
            await self.channel_layer.group_discard("admin_users", self.channel_name)
        except Exception as e:
            print("[AdminUserConsumer] Error during group_discard:", e)
            traceback.print_exc()

    async def user_update(self, event):
        """Handle user updates sent via group_send from signals or views."""
        action = event.get("action")
        data = event.get("data")

        # map to frontend-friendly types if desired
        if action == "CREATE":
            payload_type = "CREATED"
        elif action == "DELETE":
            payload_type = "DELETED"
        else:
            payload_type = "UPDATED"

        try:
            await self.send_json({"type": payload_type, "data": data})
        except Exception:
            print("[AdminUserConsumer] ERROR sending json:")
            traceback.print_exc()
