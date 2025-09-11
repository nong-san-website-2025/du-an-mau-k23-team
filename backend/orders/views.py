from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

class OrderViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'seller_pending', 'seller_processing', 'seller_success', 'seller_approve', 'seller_complete']:
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

        # Auto-approve: chuyển pending -> shipping nếu quá 10 phút
        ten_minutes_ago = timezone.now() - timedelta(minutes=10)
        stale_pending = Order.objects.filter(status='pending', created_at__lte=ten_minutes_ago)
        if stale_pending.exists():
            stale_pending.update(status='shipping')

        # Search theo tên khách hàng hoặc số điện thoại
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) | 
                Q(customer_phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='seller/pending')
    def seller_pending(self, request):
        """Danh sách đơn chờ xác nhận cho Seller (lọc theo sản phẩm thuộc seller)"""
        if not request.user.is_authenticated:
            return Response({'error': 'Yêu cầu đăng nhập'}, status=status.HTTP_401_UNAUTHORIZED)
        # Kiểm tra có hồ sơ seller hay không
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)

        # Lấy tất cả order có item thuộc về sản phẩm của seller hiện tại và status pending

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)

        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='pending').distinct().order_by('-created_at')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='seller/processing')
    def seller_processing(self, request):
        """Danh sách đơn đang xử lý (shipping) của seller"""
        if not request.user.is_authenticated:
            return Response({'error': 'Yêu cầu đăng nhập'}, status=status.HTTP_401_UNAUTHORIZED)
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='shipping').distinct().order_by('-created_at')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='seller/success')
    def seller_success(self, request):
        """Danh sách đơn thành công (success) của seller"""
        if not request.user.is_authenticated:
            return Response({'error': 'Yêu cầu đăng nhập'}, status=status.HTTP_401_UNAUTHORIZED)
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='success').distinct().order_by('-created_at')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='seller/approve')
    def seller_approve(self, request, pk=None):
        """Seller duyệt đơn: chuyển pending -> shipping"""
        if not request.user.is_authenticated:
            return Response({'error': 'Yêu cầu đăng nhập'}, status=status.HTTP_401_UNAUTHORIZED)

        # Kiểm tra order có chứa sản phẩm của seller này không
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền duyệt'}, status=status.HTTP_403_FORBIDDEN)

        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=status.HTTP_404_NOT_FOUND)

        from products.models import Product
        seller_product_ids = set(Product.objects.filter(seller=seller).values_list('id', flat=True))
        order_product_ids = set(order.items.values_list('product_id', flat=True))
        if len(seller_product_ids.intersection(order_product_ids)) == 0:
            return Response({'error': 'Bạn không có quyền duyệt đơn này'}, status=status.HTTP_403_FORBIDDEN)

        if order.status != 'pending':
            return Response({'error': 'Chỉ có thể duyệt đơn ở trạng thái pending'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = 'shipping'
        order.save(update_fields=['status'])
        return Response({'message': 'Đã duyệt đơn, chuyển sang chờ nhận hàng', 'status': order.status})

<<<<<<< HEAD
    @action(detail=True, methods=['post'], url_path='admin-cancel')
    def admin_cancel(self, request, pk=None):
        """Admin hủy đơn hàng"""
        if not request.user.is_authenticated or not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền hủy đơn'}, status=status.HTTP_403_FORBIDDEN)
=======
    @action(detail=True, methods=['post'], url_path='seller/complete')
    def seller_complete(self, request, pk=None):
        """Seller xác nhận hoàn tất giao hàng: chuyển shipping -> success"""
        if not request.user.is_authenticated:
            return Response({'error': 'Yêu cầu đăng nhập'}, status=status.HTTP_401_UNAUTHORIZED)

        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền cập nhật'}, status=status.HTTP_403_FORBIDDEN)

>>>>>>> ChiTham
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=status.HTTP_404_NOT_FOUND)

<<<<<<< HEAD
        if order.status in ['success', 'cancelled']:
            return Response({'error': 'Không thể hủy đơn ở trạng thái hiện tại'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = 'cancelled'
        order.save(update_fields=['status'])
        return Response({'message': 'Đã hủy đơn hàng thành công', 'status': order.status})
=======
        from products.models import Product
        seller_product_ids = set(Product.objects.filter(seller=seller).values_list('id', flat=True))
        order_product_ids = set(order.items.values_list('product_id', flat=True))
        if len(seller_product_ids.intersection(order_product_ids)) == 0:
            return Response({'error': 'Bạn không có quyền cập nhật đơn này'}, status=status.HTTP_403_FORBIDDEN)

        if order.status != 'shipping':
            return Response({'error': 'Chỉ có thể hoàn tất đơn ở trạng thái shipping'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = 'success'
        order.save(update_fields=['status'])
        return Response({'message': 'Đơn hàng đã giao thành công', 'status': order.status})
>>>>>>> ChiTham

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
