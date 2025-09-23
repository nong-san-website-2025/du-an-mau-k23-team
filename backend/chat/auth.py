import jwt
from urllib.parse import parse_qs
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.auth import AuthMiddlewareStack

# Defer get_user_model() until apps are ready to avoid AppRegistryNotReady

class JWTAuthMiddleware:
    """
    ASGI v3-compatible JWT auth middleware for Channels 4.
    Expects token in query string: ?token=<JWT>
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token_list = parse_qs(query_string).get("token", [])
        user = None
        if token_list:
            token = token_list[0]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"]) 
                user_id = payload.get("user_id") or payload.get("id") or payload.get("sub")
                user = await self.get_user(user_id)
            except Exception:
                user = None
        # Inject authenticated user (or None) into scope
        scope["user"] = user
        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))