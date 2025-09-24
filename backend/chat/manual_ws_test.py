import os
import sys
import django
import asyncio

# Ensure backend package path is importable
CURRENT_FILE = os.path.abspath(__file__)
BACKEND_DIR = os.path.dirname(os.path.dirname(CURRENT_FILE))  # .../backend
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import RefreshToken

from config.asgi import application
from chat.models import Conversation, Message
from sellers.models import Seller


User = get_user_model()


@database_sync_to_async
def get_token_for_user(user):
    # Generate a short-lived access token for WS auth
    return str(RefreshToken.for_user(user).access_token)


@database_sync_to_async
def get_or_create_user(username: str, email: str, password: str):
    user, created = User.objects.get_or_create(username=username, defaults={"email": email})
    if created or not user.has_usable_password():
        user.set_password(password)
        user.save()
    return user


@database_sync_to_async
def get_or_create_seller(user):
    seller, _ = Seller.objects.get_or_create(user=user, defaults={"store_name": "Test Store"})
    return seller


@database_sync_to_async
def get_or_create_conversation(buyer, seller):
    conv, _ = Conversation.objects.get_or_create(user=buyer, seller=seller)
    return conv


@database_sync_to_async
def get_messages(conv):
    return list(Message.objects.filter(conversation=conv).order_by("-id").values("id", "sender_id", "content", "created_at")[:3])


async def main():
    # 1) Prepare users and seller profile
    buyer = await get_or_create_user("buyer_test", "buyer_test@example.com", "buyer123")
    seller_user = await get_or_create_user("seller_test", "seller_test@example.com", "seller123")
    seller = await get_or_create_seller(seller_user)

    # 2) Ensure conversation exists
    conv = await get_or_create_conversation(buyer, seller)

    # 3) Issue tokens
    buyer_token = await get_token_for_user(buyer)
    seller_token = await get_token_for_user(seller_user)

    ws_path_buyer = f"/ws/chat/conv/{conv.id}/?token={buyer_token}"
    ws_path_seller = f"/ws/chat/conv/{conv.id}/?token={seller_token}"

    print("Connecting buyer WS:", ws_path_buyer)
    buyer_comm = WebsocketCommunicator(application, ws_path_buyer)
    ok_buyer, _ = await buyer_comm.connect()
    print("  buyer connected:", ok_buyer)

    print("Connecting seller WS:", ws_path_seller)
    seller_comm = WebsocketCommunicator(application, ws_path_seller)
    ok_seller, _ = await seller_comm.connect()
    print("  seller connected:", ok_seller)

    if not (ok_buyer and ok_seller):
        print("❌ Failed to connect one of the communicators. Aborting.")
        try:
            await buyer_comm.disconnect()
        except Exception:
            pass
        try:
            await seller_comm.disconnect()
        except Exception:
            pass
        return

    # 4) Send a message from buyer and expect both sides to receive it
    payload = {"type": "message", "content": "Hello from buyer (WS test)"}
    print("Sending from buyer:", payload)
    await buyer_comm.send_json_to(payload)

    buyer_recv = await buyer_comm.receive_json_from(timeout=5)
    print("Buyer received:", buyer_recv)

    seller_recv = await seller_comm.receive_json_from(timeout=5)
    print("Seller received:", seller_recv)

    # 5) Verify it also persisted in DB
    msgs = await get_messages(conv)
    print("Last messages in DB:")
    for m in msgs:
        print(f"  #{m['id']} sender={m['sender_id']} content={m['content']!r} at={m['created_at']}")

    # 6) Cleanup
    await buyer_comm.disconnect()
    await seller_comm.disconnect()


if __name__ == "__main__":
    asyncio.run(main())