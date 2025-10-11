from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
import logging

from .models import Order, Complaint
from .serializers import OrderSerializer, OrderCreateSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .services import complete_order, OrderProcessingError
from orders.models import OrderItem
from django.db.models import Sum
from django.utils.timezone import now, timedelta
from rest_framework.decorators import api_view, permission_classes
from promotions.models import Voucher, UserVoucher
from users.models import PointHistory


logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in [
            'list', 'retrieve', 'create', 
            'seller_pending', 'seller_processing', 
            'seller_success', 'seller_approve', 'seller_complete'
        ]:
            return [IsAuthenticated()]
        elif self.action in ['admin_list', 'admin_detail']:
            return [IsAuthenticated()]  # sẽ check is_admin trong method
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all()

        # Admin xem tất cả
        if self.action == 'admin_list' and user.is_authenticated and getattr(user, 'is_admin', False):
            pass
        elif user.is_authenticated:
            queryset = queryset.filter(user=user)

        # Filter status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Auto-approve sau 10 phút
        ten_minutes_ago = timezone.now() - timedelta(minutes=10)
        stale_pending = Order.objects.filter(status='pending', created_at__lte=ten_minutes_ago)
        if stale_pending.exists():
            stale_pending.update(status='shipping')

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) |
                Q(customer_phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        """Top sản phẩm bán chạy (kèm số lượng đã đặt tổng cộng)"""
        from products.models import Product

        top_products = (
            OrderItem.objects
            .values(
                'product_id',
                'product__name',
                'product__image',
                'product__seller__store_name',
                'product__ordered_quantity',  # ✅ thêm dòng này
            )
            .annotate(
                quantity_sold=Sum('quantity'),
                revenue=Sum('price')
            )
            .order_by('-quantity_sold')[:10]
        )
        return Response(top_products)

    
    @action(detail=False, methods=['get'], url_path='recent')
    def recent_orders(self, request):
        """10 đơn gần nhất"""
        user = request.user
        qs = Order.objects.all().order_by('-created_at')
        if not getattr(user, 'is_admin', False):
            qs = qs.filter(user=user)
        serializer = OrderSerializer(qs[:10], many=True)
        return Response(serializer.data)

    # ========================
    # Seller APIs
    # ========================
    @action(detail=False, methods=['get'], url_path='seller/pending')
    def seller_pending(self, request):
        """Đơn chờ xác nhận cho seller"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='pending').distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/processing')
    def seller_processing(self, request):
        """Đơn đang shipping"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='shipping').distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/complete')
    def seller_completed_orders(self, request):
        """Đơn đã hoàn tất"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        orders = Order.objects.filter(items__product_id__in=seller_product_ids, status='success').distinct()
        return Response(self.get_serializer(orders, many=True).data)

    @action(detail=True, methods=['post'], url_path='seller/approve')
    def seller_approve(self, request, pk=None):
        """Seller duyệt đơn (pending -> shipping)"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền duyệt'}, status=403)

        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

        if order.status != 'pending':
            return Response({'error': 'Chỉ duyệt được đơn pending'}, status=400)

        order.status = 'shipping'
        order.save(update_fields=['status'])
        return Response({'message': 'Đã duyệt đơn', 'status': order.status})

    @action(detail=True, methods=['post'], url_path='seller/complete')
    def seller_complete(self, request, pk=None):
        """Seller xác nhận hoàn tất giao hàng"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền cập nhật'}, status=403)

        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

        try:
            updated_order = complete_order(order, seller)
        except OrderProcessingError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            logger.exception("Lỗi không xác định khi hoàn tất đơn")
            return Response({'error': 'Lỗi không xác định'}, status=500)

        return Response({'message': 'Hoàn tất đơn hàng', 'status': updated_order.status})

    # ========================
    # Admin APIs
    # ========================
    @action(detail=False, methods=['get'], url_path='admin-list')
    def admin_list(self, request):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        return Response(self.get_serializer(self.get_queryset(), many=True).data)

    @action(detail=True, methods=['get'], url_path='admin-detail')
    def admin_detail(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=['patch'], url_path='admin-soft-delete')
    def admin_soft_delete(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            order = Order.all_objects.get(pk=pk)
            if order.is_deleted:
                return Response({'error': 'Đơn hàng đã bị ẩn'}, status=400)
            order.soft_delete()
            return Response({'message': 'Đã ẩn đơn hàng'})
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

    @action(detail=True, methods=['patch'], url_path='admin-restore')
    def admin_restore(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False):
            return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            order = Order.all_objects.get(pk=pk)
            if not order.is_deleted:
                return Response({'error': 'Đơn hàng chưa bị ẩn'}, status=400)
            order.restore()
            return Response({'message': 'Đã khôi phục đơn hàng'})
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

    # ========================
    # Create order + voucher + points
    # ========================
    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        code = self.request.data.get("voucher_code") or self.request.data.get("voucher_id")

        if code:
            try:
                with transaction.atomic():
                    uv = UserVoucher.objects.select_for_update().select_related("voucher").filter(
                        user=self.request.user, voucher__code=code
                    ).first()
                    if not uv:
                        raise ValueError("Voucher không thuộc về bạn")

                    voucher = uv.voucher
                    if not voucher.active:
                        raise ValueError("Voucher đã tắt")
                    if voucher.start_at and timezone.now() < voucher.start_at:
                        raise ValueError("Voucher chưa tới hạn")
                    if voucher.end_at and timezone.now() > voucher.end_at:
                        raise ValueError("Voucher đã hết hạn")
                    if uv.remaining_for_user() <= 0:
                        raise ValueError("Bạn đã dùng hết voucher này")
                    if voucher.min_order_value and order.total_price < voucher.min_order_value:
                        raise ValueError("Đơn chưa đạt giá trị tối thiểu")

                    # tính giảm giá
                    discount = 0.0
                    if voucher.discount_amount:
                        discount = float(voucher.discount_amount)
                    elif voucher.discount_percent:
                        discount = order.total_price * voucher.discount_percent / 100.0
                        if voucher.max_discount_amount:
                            discount = min(discount, float(voucher.max_discount_amount))
                    elif voucher.freeship_amount:
                        discount = float(voucher.freeship_amount)

                    discount = min(discount, order.total_price)
                    order.total_price -= discount
                    order.voucher = voucher
                    order.save(update_fields=["total_price", "voucher"])

                    uv.mark_used_once()
            except Exception as e:
                logger.error(f"Lỗi xử lý voucher: {e}")

        # tích điểm
        points_earned = (order.total_price // 1000) * 10
        # Tích điểm dựa trên tất cả orders đã tạo
        created_orders = getattr(serializer, '_created_orders', [order])
        total_amount = sum(o.total_price for o in created_orders)
        points_earned = (total_amount // 1000) * 10
        if points_earned > 0:
            user = self.request.user
            user.points += points_earned
            user.save()
            # Lưu lịch sử tích điểm với order đầu tiên
            from users.models import PointHistory
            PointHistory.objects.create(
                user=user,
                order_id=str(order.id),
                points=points_earned,
                amount=total_amount,
                action=f"Cộng điểm khi thanh toán đơn hàng #{order.id}" + (f" và {len(created_orders)-1} đơn khác" if len(created_orders) > 1 else "")
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_products(request):
    filter_type = request.query_params.get("filter", "month")  # mặc định = tháng
    today = now().date()

    if filter_type == "today":
        start_date = today
    elif filter_type == "week":
        start_date = today - timedelta(days=today.weekday())  # đầu tuần (thứ 2)
    else:  # month
        start_date = today.replace(day=1)

    items = (
        OrderItem.objects
        .filter(order__created_at__date__gte=start_date)
        .values(
            product_id=F("product__id"),
            product_name=F("product__name"),
            shop_name=F("product__shop__name"),
            thumbnail=F("product__thumbnail"),
        )
        .annotate(
            quantity_sold=Sum("quantity"),
            revenue=Sum(F("quantity") * F("price"))
            )
        .order_by("-quantity_sold")[:10]
    )

    return Response(list(items))
