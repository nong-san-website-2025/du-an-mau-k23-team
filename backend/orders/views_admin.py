# 🔧 ADMIN VIEWS - Simplified for Django Admin
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Q, Sum, Count, F
from django.utils import timezone
from datetime import timedelta

from .models import Order, OrderItem
from .serializers import OrderSerializer
import logging

logger = logging.getLogger(__name__)


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ✅ Admin API untuk quản lý đơn hàng
    - List: Xem tất cả đơn hàng
    - Retrieve: Xem chi tiết đơn hàng
    - Custom actions: Filter theo status, ngày
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        """Admin có thể xem tất cả đơn hàng"""
        queryset = Order.objects.all().select_related('user').prefetch_related('items')
        
        # Filter theo status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter theo khoảng thời gian
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Filter theo search term
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(id__icontains=search) |
                Q(user__full_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        # Sắp xếp theo mới nhất trước
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """📊 Thống kê đơn hàng"""
        queryset = self.get_queryset()
        
        total = queryset.count()
        total_revenue = queryset.aggregate(total=Sum('total_price'))['total'] or 0
        
        by_status = queryset.values('status').annotate(count=Count('id')).order_by('status')
        
        # Đơn hàng trong 7 ngày
        week_ago = timezone.now() - timedelta(days=7)
        week_orders = queryset.filter(created_at__gte=week_ago).count()
        
        return Response({
            'total_orders': total,
            'total_revenue': float(total_revenue),
            'orders_this_week': week_orders,
            'by_status': list(by_status)
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_order_list(request):
    """✅ Simple list API để frontend admin dùng"""
    queryset = Order.objects.all().select_related('user').prefetch_related('items')
    
    # Filter
    status_param = request.query_params.get('status')
    if status_param:
        queryset = queryset.filter(status=status_param)
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(id__icontains=search) |
            Q(user__full_name__icontains=search) |
            Q(user__email__icontains=search)
        )

    # --- DEBUG: log incoming params and queryset summary to help diagnose empty results ---
    try:
        params = {k: request.query_params.get(k) for k in ['status', 'start_date', 'end_date', 'search', 'page', 'page_size']}
        total_before = queryset.count()
        status_counts = list(queryset.values('status').annotate(cnt=Count('id')).order_by('-cnt'))
        logger.info(f"[admin_order_list] params={params} total_before_pagination={total_before} status_counts={status_counts}")
    except Exception:
        logger.exception("[admin_order_list] debug logging failed")
    
    # Pagination
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    total_count = queryset.count()
    orders = queryset.order_by('-created_at')[start_idx:end_idx]
    
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'count': total_count,
        'page': page,
        'page_size': page_size
    })
