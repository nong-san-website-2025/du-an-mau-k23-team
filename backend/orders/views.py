from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

class OrderViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [IsAuthenticated()]
        elif self.action in ['admin_list', 'admin_detail']:
            return [IsAuthenticated()]  # Sẽ check is_admin trong method
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        # Sử dụng default manager để chỉ lấy orders chưa bị xóa (soft delete)
        queryset = Order.objects.all()

        # Nếu là admin và gọi admin_list, trả về tất cả orders (không bị xóa)
        if self.action == 'admin_list' and user.is_authenticated and getattr(user, 'is_admin', False):
            # Admin có thể xem tất cả đơn hàng chưa bị xóa
            pass
        elif user.is_authenticated:
            queryset = queryset.filter(user=user)  # User chỉ xem order của mình

        # Filter theo status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Search theo tên khách hàng hoặc số điện thoại
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) | 
                Q(customer_phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='admin-list')
    def admin_list(self, request):
        """API cho admin xem tất cả đơn hàng"""
        if not request.user.is_authenticated or not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền truy cập'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='admin-detail')
    def admin_detail(self, request, pk=None):
        """API cho admin xem chi tiết đơn hàng"""
        if not request.user.is_authenticated or not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền truy cập'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            order = Order.objects.get(pk=pk)
            serializer = self.get_serializer(order)
            return Response(serializer.data)
            
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, 
                          status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'], url_path='admin-soft-delete')
    def admin_soft_delete(self, request, pk=None):
        """API cho admin ẩn đơn hàng (soft delete) - chỉ để tham khảo, không sử dụng trong UI"""
        if not request.user.is_authenticated or not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền truy cập'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Sử dụng all_objects để có thể tìm cả orders đã bị xóa
            order = Order.all_objects.get(pk=pk)
            
            if order.is_deleted:
                return Response({'error': 'Đơn hàng đã bị ẩn trước đó'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            order.soft_delete()
            return Response({'message': 'Đã ẩn đơn hàng thành công'})
            
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, 
                          status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'], url_path='admin-restore')
    def admin_restore(self, request, pk=None):
        """API cho admin khôi phục đơn hàng đã bị ẩn - chỉ để tham khảo"""
        if not request.user.is_authenticated or not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền truy cập'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Sử dụng all_objects để có thể tìm cả orders đã bị xóa
            order = Order.all_objects.get(pk=pk)
            
            if not order.is_deleted:
                return Response({'error': 'Đơn hàng chưa bị ẩn'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            order.restore()
            return Response({'message': 'Đã khôi phục đơn hàng thành công'})
            
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, 
                          status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        # Tích điểm: cứ 1000đ thì được 10 điểm
        points_earned = (order.total_price // 1000) * 10
        if points_earned > 0:
            user = self.request.user
            user.points += points_earned
            user.save()
            # Lưu lịch sử tích điểm
            from users.models import PointHistory
            PointHistory.objects.create(
                user=user,
                order_id=str(order.id),
                points=points_earned,
                amount=order.total_price,
                action=f"Cộng điểm khi thanh toán đơn hàng #{order.id}"
            )
