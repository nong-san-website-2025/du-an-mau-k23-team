from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Product
from .serializers import ProductSerializer, ProductListSerializer
from decimal import Decimal
from datetime import date, datetime
import uuid
import json


def make_json_safe(obj):
	"""Recursively convert common non-JSON-serializable types to primitives.

	- Decimal -> float (or int if no fractional part)
	- datetime/date -> ISO string
	- UUID -> str
	- bytes -> decode utf-8 or b64
	"""
	if obj is None:
		return None
	if isinstance(obj, dict):
		return {k: make_json_safe(v) for k, v in obj.items()}
	if isinstance(obj, list):
		return [make_json_safe(v) for v in obj]
	if isinstance(obj, tuple):
		return tuple(make_json_safe(v) for v in obj)
	if isinstance(obj, Decimal):
		# prefer int when possible
		if obj == obj.to_integral_value():
			return int(obj)
		return float(obj)
	if isinstance(obj, (datetime, date)):
		return obj.isoformat()
	if isinstance(obj, uuid.UUID):
		return str(obj)
	if isinstance(obj, bytes):
		try:
			return obj.decode('utf-8')
		except Exception:
			import base64
			return base64.b64encode(obj).decode('ascii')
	# fallback to primal json types if possible
	try:
		json.dumps(obj)
		return obj
	except TypeError:
		return str(obj)


@receiver(post_save, sender=Product)
def broadcast_product_to_admin(sender, instance, created, **kwargs):
	"""
	When a product is created or updated, broadcast it to the admin_products group
	so connected admin clients receive it in real-time.
	"""
	try:
		channel_layer = get_channel_layer()
		action = "CREATE" if created else "UPDATE"
		# Use the list serializer so the broadcasted object matches what
		# the admin list endpoint returns (fields, nested seller/store, ids).
		serializer = ProductListSerializer(instance, context={})
		safe_data = make_json_safe(serializer.data)
		payload = {
			"type": "product_update",
			"action": action,
			"data": safe_data,
		}
		async_to_sync(channel_layer.group_send)("admin_products", payload)
		print(f"📡 [WS] Đã bắn tín hiệu {action} cho sản phẩm: {instance.id} - {instance.name}")
	except Exception as e:
		print("[products.signals] Error broadcasting product:", e)
		import traceback
		traceback.print_exc()