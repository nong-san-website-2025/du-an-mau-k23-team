# ✅ BACKUP views - TODO: Uncomment hàm cần thiết từ original views.py

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import Q, Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from django.views.decorators.http import condition

from .models import Order, OrderItem, Preorder
from .serializers import OrderSerializer, OrderCreateSerializer, PreOrderSerializer
from complaints.models import Complaint
from promotions.models import Voucher, UserVoucher


# =========================================================
# USER STATS VIEWS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_behavior_stats(request, user_id):
    """User behavior statistics"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    successful_orders = Order.objects.filter(
        user=user,
        status__in=['completed', 'delivered']
    )
    total_orders = successful_orders.count()
    total_spent = successful_orders.aggregate(total=Sum('total_price'))['total'] or 0

    ninety_days_ago = timezone.now() - timedelta(days=90)
    purchase_frequency_90d = successful_orders.filter(
        created_at__gte=ninety_days_ago
    ).count()

    total_returned = Order.objects.filter(user=user, status='returned').count()
    return_rate = round((total_returned / total_orders * 100), 1) if total_orders > 0 else 0

    total_complaints = Complaint.objects.filter(user=user).count()
    complaint_rate = round((total_complaints / total_orders * 100), 1) if total_orders > 0 else 0

    return Response({
        "total_orders": total_orders,
        "total_spent": int(total_spent),
        "purchase_frequency_90d": purchase_frequency_90d,
        "return_rate": return_rate,
        "complaint_rate": complaint_rate,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_orders(request, user_id):
    """Get orders for specific user"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    orders = Order.objects.filter(user=user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)


# =========================================================
# ADMIN REPORTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_report(request):
    """Revenue statistics"""
    queryset = Order.objects.filter(status__in=['completed', 'delivered'])
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    
    total_revenue = queryset.aggregate(total=Sum('total_price'))['total'] or 0
    total_orders = queryset.count()
    average_order = total_revenue / total_orders if total_orders > 0 else 0
    
    return Response({
        'total_revenue': float(total_revenue),
        'total_orders': total_orders,
        'average_order_value': float(average_order)
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_statistics_report(request):
    """Order statistics by status"""
    all_orders = Order.objects.all()
    
    stats = {
        'total': all_orders.count(),
        'pending': all_orders.filter(status='pending').count(),
        'processing': all_orders.filter(status__in=['shipping', 'ready_to_pick']).count(),
        'delivered': all_orders.filter(status='delivered').count(),
        'cancelled': all_orders.filter(status='cancelled').count(),
        'returned': all_orders.filter(status='returned').count(),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """Dashboard statistics"""
    today = timezone.now().date()
    
    stats = {
        'orders_today': Order.objects.filter(created_at__date=today).count(),
        'orders_this_week': Order.objects.filter(created_at__date__gte=today - timedelta(days=7)).count(),
        'total_revenue_today': Order.objects.filter(
            created_at__date=today,
            status__in=['completed', 'delivered']
        ).aggregate(total=Sum('total_price'))['total'] or 0,
    }
    
    return Response(stats)


# =========================================================
# ORDER VIEWSET
# =========================================================

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['admin_list']:
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        user = self.request.user
        if self.action == 'admin_list' and user.is_staff:
            return Order.objects.all().select_related('user')
        if user.is_authenticated:
            return Order.objects.filter(user=user).select_related('user')
        return Order.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    @action(detail=False, methods=['get'])
    def admin_list(self, request):
        """Get all orders for admin"""
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        
        queryset = Order.objects.all().select_related('user')
        
        # Filter
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        orders = queryset[start:end]
        
        serializer = self.get_serializer(orders, many=True)
        return Response({
            'count': total,
            'results': serializer.data,
            'page': page
        })


# Dummy views needed by urls.py
class PreorderDeleteView(generics.DestroyAPIView):
    queryset = Preorder.objects.all()
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
def order_notifications_sse(request):
    return Response({'status': 'OK'})


@api_view(['POST'])
def payment_ipn(request):
    return Response({'status': 'OK'})
