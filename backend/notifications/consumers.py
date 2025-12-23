# notifications/consumers.py
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Lấy user từ scope (đã qua JWT middleware của bạn)
        self.user = self.scope.get("user")
        
        if self.user is None or self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Tạo group riêng cho từng user để nhận thông báo cá nhân
        self.room_group_name = f"user_updates_{self.user.id}"

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

    # Hàm nhận dữ liệu từ signals.py gửi qua group_send
    async def sidebar_update(self, event):
        # Gửi dữ liệu JSON xuống React
        await self.send_json({
            "event": event.get("event"),
            "data": event.get("data")
        })

    async def send_notification(self, event):
    # ĐOẠN NÀY LÀ QUAN TRỌNG NHẤT
    # Nó nhận tin từ Signal (type: send_notification) và bắn xuống Browser
        async def send_notification(self, event):
        # Sử dụng send_json để đồng bộ với class AsyncJsonWebsocketConsumer
            await self.send_json({
                "event": event.get("event", "new_notification"),
                "data": event.get("data")
            })