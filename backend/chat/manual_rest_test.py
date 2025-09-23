import os
import sys
import django

# Ensure backend package path is importable
CURRENT_FILE = os.path.abspath(__file__)
BACKEND_DIR = os.path.dirname(os.path.dirname(CURRENT_FILE))  # .../backend
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from sellers.models import Seller

User = get_user_model()


def token_for(user):
    return str(RefreshToken.for_user(user).access_token)


def main():
    # Arrange: create buyer & seller
    buyer, _ = User.objects.get_or_create(username="buyer_test", defaults={"email": "buyer_test@example.com"})
    seller_user, _ = User.objects.get_or_create(username="seller_test", defaults={"email": "seller_test@example.com"})
    seller, _ = Seller.objects.get_or_create(user=seller_user, defaults={"store_name": "Test Store"})

    buyer_token = token_for(buyer)
    seller_token = token_for(seller_user)

    buyer_api = APIClient()
    buyer_api.credentials(HTTP_AUTHORIZATION=f"Bearer {buyer_token}")

    seller_api = APIClient()
    seller_api.credentials(HTTP_AUTHORIZATION=f"Bearer {seller_token}")

    # 1) Buyer ensures conversation
    resp = buyer_api.post("/api/chat/conversations/", {"seller": seller.id}, format="json")
    print("Ensure conversation (buyer -> POST)", resp.status_code, resp.json())
    conv_id = resp.json()["id"]

    # 2) Buyer loads history (should be list)
    resp = buyer_api.get(f"/api/chat/conversations/{conv_id}/messages/")
    print("Buyer GET history:", resp.status_code, resp.json())

    # 3) Buyer sends a message via REST
    resp = buyer_api.post(f"/api/chat/conversations/{conv_id}/messages/", {"content": "Hello via REST"}, format="json")
    print("Buyer POST message:", resp.status_code, resp.json())

    # 4) Seller reads history
    resp = seller_api.get(f"/api/chat/conversations/{conv_id}/messages/")
    print("Seller GET history:", resp.status_code)
    data = resp.json()
    print("  total messages:", len(data))
    if data:
        print("  last:", data[-1])


if __name__ == "__main__":
    main()