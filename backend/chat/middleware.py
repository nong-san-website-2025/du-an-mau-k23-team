from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    try:
        access = AccessToken(token)
        user_id = access.get("user_id")
        if not user_id:
            print("[JWT WS ERROR] No user_id in token payload")
            return AnonymousUser()
        
        user = User.objects.get(id=user_id)
        return user
    except Exception as e:
        print(f"[JWT WS ERROR] Token resolution failed: {e}")
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Default to AnonymousUser
        scope["user"] = AnonymousUser()

        query_string = scope.get("query_string", b"").decode()
        query = parse_qs(query_string)

        token = query.get("token")
        if token:
            t = token[0]
            # Print first 10 chars of token for debug, but hide rest for security
            print(f"[JWT WS] Token detected (prefix: {t[:10]}...), attempting resolution")
            try:
                user = await get_user_from_token(t)
                if user and user.is_authenticated:
                    print(f"[JWT WS] Successfully resolved user: {user.username} (ID: {user.id})")
                    scope["user"] = user
                else:
                    print("[JWT WS] Token resolved to AnonymousUser or unauthenticated user")
            except Exception as e:
                print(f"[JWT WS] Exception during middleware execution: {e}")
        else:
            print("[JWT WS] No token found in query string")

        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    from channels.auth import AuthMiddlewareStack
    # Ensure JWTAuthMiddleware runs after AuthMiddlewareStack so a provided
    # token can override any user populated by session auth. This prevents
    # the AuthMiddlewareStack from overwriting the user set from the token
    # and avoids immediate socket close due to anonymous user.
    return AuthMiddlewareStack(JWTAuthMiddleware(inner))
