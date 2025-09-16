# websockets/consumers/orders_consumer.py
import json
from decimal import Decimal
from channels.generic.websocket import AsyncWebsocketConsumer


def _json_default(o):
    # Ensure any Decimal is JSON-serializable
    if isinstance(o, Decimal):
        return float(o)
    return str(o)


class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "orders_group"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except Exception:
            # Ignore malformed JSON from clients
            return
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "order_update",
                "data": data,
            },
        )

    async def order_update(self, event):
        await self.send(text_data=json.dumps(event["data"], default=_json_default, ensure_ascii=False))
