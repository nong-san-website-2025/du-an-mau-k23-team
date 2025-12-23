import json
import time
from django.http import StreamingHttpResponse
from django.contrib.auth import get_user_model
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAdminUser
from ..models import Order

User = get_user_model()

def order_notifications_sse(request):
    token = request.GET.get('token')
    if not token: return StreamingHttpResponse(status=401)
    
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        access_token = AccessToken(token)
        user = User.objects.get(id=access_token['user_id'])
        request.user = user
    except Exception:
        return StreamingHttpResponse(status=401)

    if not getattr(request.user, 'is_admin', False):
        return StreamingHttpResponse(status=403)

    def event_stream():
        last_id = 0
        while True:
            new_orders = Order.objects.filter(id__gt=last_id).order_by('id')[:10]
            if new_orders.exists():
                for order in new_orders:
                    data = {
                        'type': 'new_order', 'order_id': order.id,
                        'customer_name': order.customer_name, 'total_price': float(order.total_price),
                        'status': order.status, 'created_at': order.created_at.isoformat()
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    last_id = max(last_id, order.id)
            time.sleep(2) 

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response