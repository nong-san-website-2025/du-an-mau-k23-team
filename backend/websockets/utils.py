from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal


def _convert_decimal(obj):
    """Recursively convert Decimal to float inside dicts/lists/tuples."""
    if isinstance(obj, dict):
        return {k: _convert_decimal(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_convert_decimal(i) for i in obj]
    if isinstance(obj, Decimal):
        return float(obj)
    return obj


def send_order_update(data):
    # Convert any nested Decimal to float before sending via channels (msgpack-safe)
    safe_data = _convert_decimal(data)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "orders_group",
        {
            "type": "order_update",
            "data": safe_data,
        },
    )
