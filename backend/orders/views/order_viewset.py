import logging
from datetime import datetime, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import F, Sum, Subquery, OuterRef
from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser # <--- THÊM IsAdminUser
from rest_framework import serializers

from notifications.models import Notification
from products.models import Product, ProductImage
from promotions.models import UserVoucher
from django.contrib.auth import get_user_model # <--- THÊM import này
from users.models import PointHistory



from users.utils_views import get_client_ip 

from vnpay_python.vnpay import vnpay 

from ..models import Order, OrderItem
from ..serializers import OrderSerializer, OrderCreateSerializer
from ..services import complete_order, reduce_stock_for_order, OrderProcessingError

logger = logging.getLogger(__name__)

class OrderViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in [
            'list', 'retrieve', 'create', 
            'seller_pending', 'seller_processing', 
            'seller_completed_orders', 'seller_approve', 'seller_complete',
            'seller_cancelled', 'cancel', 'confirm_received'  # <--- PHẢI THÊM ACTION NÀY VÀO ĐÂY
        ]:
            return [IsAuthenticated()]
        elif self.action in ['admin_list', 'admin_detail', 'admin_soft_delete', 'admin_restore']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all()

        if self.action == 'admin_list' and getattr(user, 'is_admin', False):
            pass 
        elif self.action == 'get_detail':
            pass
        elif user.is_authenticated:
            queryset = queryset.filter(user=user)
            status_param = self.request.query_params.get('status')
            if status_param:
                if status_param == 'return':
                    refund_statuses = [
                        'REFUND_REQUESTED', 'WAITING_RETURN', 'RETURNING', 
                        'SELLER_REJECTED', 'DISPUTE_TO_ADMIN', 
                        'REFUND_APPROVED', 'REFUND_REJECTED'
                    ]
                    queryset = queryset.filter(items__status__in=refund_statuses).distinct()
                else:
                    queryset = queryset.filter(status=status_param)
            
            return queryset.order_by('-created_at')

        # Auto-approve logic
        ten_minutes_ago = timezone.now() - timedelta(minutes=10)
        stale_pending = Order.objects.filter(status='pending', created_at__lte=ten_minutes_ago)
        if stale_pending.exists():
            for order in stale_pending:
                order.status = 'shipping'
                order.save(update_fields=['status'])
                try:
                    reduce_stock_for_order(order)
                except OrderProcessingError as e:
                    logger.error(f"Lỗi trừ tồn kho khi auto-approve đơn #{order.id}: {e}")

        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(customer_name__icontains=search) | Q(customer_phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    # --- PUBLIC / USER ACTIONS ---

    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        top_products = (
             OrderItem.objects
                .filter(order__status='completed')
                .values('product_id', 'product__name', 'product__seller__store_name')
                .annotate(
                    quantity_sold=Sum('quantity'),
                    revenue=Sum('price'),
                    first_image=Subquery(
                        ProductImage.objects.filter(product=OuterRef('product_id')).values('image')[:1]
                    ),
                )
                .order_by('-quantity_sold')[:10]
        )
        return Response(top_products)

    @action(detail=False, methods=['get'], url_path='recent')
    def recent_orders(self, request):
        user = request.user
        qs = Order.objects.all().order_by('-created_at')
        if not getattr(user, 'is_admin', False):
            qs = qs.filter(user=user)
        serializer = OrderSerializer(qs[:10], many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="detail")
    def get_detail(self, request, pk=None):
        order = self.get_object()
        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='confirm-received')
    def confirm_received(self, request, pk=None):
        try:
            # Lấy đơn hàng theo ID (pk)
            order = self.get_object()
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

        # Kiểm tra điều kiện: chỉ cho phép xác nhận khi đơn hàng ở trạng thái 'delivered'
        if order.status != 'delivered':
            return Response({'error': 'Chỉ có thể xác nhận khi đơn hàng đã giao thành công'}, status=400)

        # Cập nhật trạng thái thành 'completed'
        order.status = 'completed'
        order.save(update_fields=['status'])

        # Gửi thông báo cho Seller (nếu cần)
        # Notification.objects.create(...) 

        return Response({
            'message': 'Xác nhận đã nhận hàng thành công',
            'status': order.status
        })

    @action(detail=True, methods=['post'], url_path='create_payment_url')
    def create_payment_url(self, request, pk=None):
        try:
            order = self.get_object()
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status in ['success', 'shipping', 'delivered']:
            return Response({'error': 'Đơn hàng đã được thanh toán'}, status=400)

        # VNPAY yêu cầu số tiền * 100
        amount = int(order.total_price * 100)
        order_desc = f"Thanh toan don hang {order.id}"
        bank_code = request.data.get('bank_code', '')
        ip_addr = get_client_ip(request) # Lấy từ users.utils

        # Khởi tạo class vnpay từ app vnpay_python
        vnp = vnpay() 
        vnp.requestData['vnp_Version'] = '2.1.0'
        vnp.requestData['vnp_Command'] = 'pay'
        vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
        vnp.requestData['vnp_Amount'] = amount
        vnp.requestData['vnp_CurrCode'] = 'VND'
        vnp.requestData['vnp_TxnRef'] = str(order.id)
        vnp.requestData['vnp_OrderInfo'] = order_desc
        vnp.requestData['vnp_OrderType'] = "billpayment"
        vnp.requestData['vnp_Locale'] = 'vn'
        vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
        vnp.requestData['vnp_IpAddr'] = ip_addr
        vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL

        if bank_code:
            vnp.requestData['vnp_BankCode'] = bank_code

        vnpay_payment_url = vnp.get_payment_url(settings.VNPAY_URL, settings.VNPAY_HASH_SECRET)
        return Response({'payment_url': vnpay_payment_url})

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

        if order.status not in ['pending', 'shipping']:
            return Response({'error': 'Chỉ hủy được đơn đang chờ xác nhận hoặc đang giao'}, status=400)

        user = request.user
        
        # Buyer hủy
        if order.user_id == user.id:
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            self._restore_voucher(order)
            return Response({'message': 'Đơn hàng đã được hủy', 'status': order.status})

        # Seller hủy
        seller = getattr(user, 'seller', None)
        if seller:
            seller_product_ids = set(Product.objects.filter(seller=seller).values_list('id', flat=True))
            order_product_ids = set(order.items.values_list('product_id', flat=True))
            if seller_product_ids.intersection(order_product_ids):
                order.status = 'cancelled'
                order.save(update_fields=['status'])
                
                Notification.objects.create(
                    user=order.user,
                    sender=request.user,
                    type='order_status_changed',
                    title="Đơn hàng bị hủy bởi Shop",
                    message=f"Rất tiếc, đơn hàng #{order.id} đã bị Shop hủy do sự cố kho hàng.",
                    category='order'
                )
                self._restore_voucher(order)
                return Response({'message': 'Đơn hàng đã được hủy', 'status': order.status})
            
        return Response({'error': 'Bạn không có quyền với đơn hàng này'}, status=403)

    def _restore_voucher(self, order):
        """Helper để hoàn lại voucher khi hủy đơn"""
        if hasattr(order, 'voucher') and order.voucher:
            uv = UserVoucher.objects.filter(user=order.user, voucher=order.voucher).first()
            if uv:
                uv.restore_usage()
                if hasattr(order.voucher, 'used_quantity') and order.voucher.used_quantity > 0:
                    order.voucher.used_quantity = F('used_quantity') - 1
                    order.voucher.save(update_fields=['used_quantity'])

    # --- SELLER ACTIONS ---

    @action(detail=False, methods=['get'], url_path='seller/pending')
    def seller_pending(self, request):
        return self._get_seller_orders(request, status='pending')

    @action(detail=False, methods=['get'], url_path='seller/processing')
    def seller_processing(self, request):
        return self._get_seller_orders(request, status='shipping')

    @action(detail=False, methods=['get'], url_path='seller/cancelled')
    def seller_cancelled(self, request):
        return self._get_seller_orders(request, status='cancelled')
    
    @action(detail=False, methods=['get'], url_path='seller/refunds')
    def seller_refund_orders(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền'}, status=403)
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        refund_statuses = ['REFUND_REQUESTED', 'SELLER_REJECTED', 'DISPUTE_TO_ADMIN', 'REFUND_APPROVED', 'REFUND_REJECTED']
        orders = Order.objects.filter(items__product_id__in=seller_product_ids, items__status__in=refund_statuses).distinct().order_by('-created_at')
        return Response(self.get_serializer(orders, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/complete')
    def seller_completed_orders(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền'}, status=403)
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        orders = Order.objects.filter(items__product_id__in=seller_product_ids, status__in=['delivered', 'completed']).distinct()
        return Response(self.get_serializer(orders, many=True).data)

    def _get_seller_orders(self, request, status):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status=status).distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=['post'], url_path='seller/approve')
    def seller_approve(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)
        
        if order.status != 'pending':
            return Response({'error': 'Chỉ duyệt được đơn pending'}, status=400)
        
        order.status = 'shipping'
        order.save(update_fields=['status'])
        try:
            reduce_stock_for_order(order)
        except OrderProcessingError as e:
            logger.error(f"Lỗi trừ tồn kho khi duyệt đơn: {e}")
        return Response({'message': 'Đã duyệt đơn', 'status': order.status})

    @action(detail=True, methods=['post'], url_path='seller/complete')
    def seller_complete(self, request, pk=None):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn'}, status=404)
        
        if order.is_disputed:
            return Response({'error': 'Đơn hàng đang tranh chấp, không thể hoàn tất.'}, status=400)
        if order.status not in ['delivered', 'shipping']: 
             return Response({'error': 'Đơn hàng chưa giao thành công'}, status=400)

        try:
            updated_order = complete_order(order, seller)
        except OrderProcessingError as e:
            return Response({'error': str(e)}, status=400)
        except Exception:
            logger.exception("Lỗi không xác định khi hoàn tất đơn")
            return Response({'error': 'Lỗi không xác định'}, status=500)
        return Response({'message': 'Hoàn tất đơn hàng', 'status': updated_order.status})

    # --- ADMIN ACTIONS ---

    @action(detail=False, methods=['get'], url_path='admin-list')
    def admin_list(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        
        queryset = self.get_queryset()
        
        # Hỗ trợ lọc theo trạng thái và tìm kiếm ngay tại Queryset
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        search_param = request.query_params.get('search')
        if search_param:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(id__icontains=search_param) |
                Q(customer_name__icontains=search_param) |
                Q(customer_phone__icontains=search_param)
            )
            
        # Hỗ trợ lọc theo khoảng ngày
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(created_at__date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='admin-detail')
    def admin_detail(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False): return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            order = Order.all_objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=['patch'], url_path='admin-soft-delete')
    def admin_soft_delete(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False): return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            order = Order.all_objects.get(pk=pk)
            if order.is_deleted: return Response({'error': 'Đơn hàng đã bị ẩn'}, status=400)
            order.soft_delete()
            return Response({'message': 'Đã ẩn đơn hàng'})
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

    @action(detail=True, methods=['patch'], url_path='admin-restore')
    def admin_restore(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False): return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            order = Order.all_objects.get(pk=pk)
            if not order.is_deleted: return Response({'error': 'Đơn hàng chưa bị ẩn'}, status=400)
            order.restore()
            return Response({'message': 'Đã khôi phục đơn hàng'})
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                order = serializer.save(user=self.request.user)
                
                # Logic tích điểm
                created_orders = getattr(serializer, '_created_orders', [order])
                total_amount = sum(o.total_price for o in created_orders)
                points_earned = (int(total_amount) // 1000) * 10
                
                if points_earned > 0:
                    user = self.request.user
                    user.points += points_earned
                    user.save()
                    PointHistory.objects.create(
                        user=user,
                        order_id=str(order.id),
                        points=points_earned,
                        amount=total_amount,
                        action=f"Cộng điểm đơn hàng #{order.id}"
                    )
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}", exc_info=True)
            # CHÚ Ý: Đã sửa thành serializers.ValidationError
            raise serializers.ValidationError(f"Lỗi: {str(e)}")
        



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

