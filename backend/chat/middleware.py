# chat/middleware.py

import jwt
from urllib.parse import parse_qs
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async

class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token_list = query_params.get("token", [])
        
        scope["user"] = AnonymousUser()

        if token_list:
            token = token_list[0]
            try:
                # Giải mã token
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("user_id") or payload.get("id")
                
                if user_id:
                    user = await self.get_user(user_id)
                    if user:
                        scope["user"] = user
                        # Dòng này để debug xem đã nhận user chưa
                        print(f"WebSocket Auth: User {user_id} authenticated") 
            except Exception as e:
                print(f"WebSocket JWT Error: {e}")

        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None

# --- QUAN TRỌNG: Đây là hàm mà asgi.py đang tìm kiếm ---
def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)