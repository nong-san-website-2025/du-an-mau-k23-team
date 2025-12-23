from .order_viewset import OrderViewSet, user_orders
from .stats_views import (
    user_behavior_stats, revenue_report, order_statistics_report, 
    dashboard_stats, top_products_filter
)
from .payment_views import payment_ipn
from .preorder_views import PreorderDeleteView, PreorderListCreateView
from .sse_views import order_notifications_sse

# Note: user_orders mình đã chuyển vào OrderViewSet như là action 'recent' 
# nhưng trong code cũ bạn có hàm riêng `user_orders`. 
# Để giữ tương thích ngược, bạn nên bổ sung hàm user_orders vào order_viewset.py nếu FE đang gọi nó.
# Dưới đây là hàm user_orders tái định nghĩa nhanh để import không lỗi:

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from ..models import Order
from ..serializers import OrderSerializer
from django.contrib.auth import get_user_model

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_orders(request, user_id):
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    orders = Order.objects.filter(user=user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)