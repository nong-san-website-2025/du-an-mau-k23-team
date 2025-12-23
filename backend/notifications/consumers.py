import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Lấy user từ scope (đã qua JWT middleware)
        self.user = self.scope.get("user")
        
        if self.user is None or self.user.is_anonymous:
            # Từ chối kết nối nếu chưa login
            await self.close(code=4001)
            return

        # [QUAN TRỌNG] Tên Group phải KHỚP 100% với signals.py và views.py
        # Cũ (Sai): f"user_updates_{self.user.id}"
        # Mới (Đúng):
        self.room_group_name = f"user_notifications_{self.user.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # ------------------------------------------------------------------
    # Handler nhận tin nhắn từ Signal/View (type="send_notification")
    # ------------------------------------------------------------------
    async def send_notification(self, event):
        # Gửi dữ liệu JSON xuống React Client
        await self.send_json({
            "event": event.get("event", "new_notification"),
            "data": event.get("data"),
            "unread_count": event.get("unread_count") # Hỗ trợ sự kiện mark_all_read
        })