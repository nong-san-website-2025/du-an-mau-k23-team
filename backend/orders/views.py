from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, F
from django.db.models.functions.datetime import TruncDate
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
import logging
from django.conf import settings
from .models import Order, Complaint
from .serializers import OrderSerializer, OrderCreateSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .services import complete_order, OrderProcessingError
from orders.models import OrderItem
from django.utils.timezone import now, timedelta
from rest_framework.decorators import api_view, permission_classes
from promotions.models import Voucher, UserVoucher
from users.models import PointHistory
from orders.models import Preorder
from orders.serializers import PreOrderSerializer
from rest_framework import generics

from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Order, OrderItem, Complaint
from products.models import Product
from django.db.models import Sum, OuterRef, Subquery
from products.models import ProductImage
from django.http import StreamingHttpResponse
import json
import time

User = get_user_model()


logger = logging.getLogger(__name__)



@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_behavior_stats(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # === 1. Đơn hàng "thành công" (tính chi tiêu & tần suất) ===
    successful_orders = Order.objects.filter(
        user=user,
        status__in=['success', 'delivered', 'shipping', 'out_for_delivery', 'ready_to_pick', 'picking']
    )
    total_orders = successful_orders.count()
    total_spent = successful_orders.aggregate(
        total=Sum('total_price')
    )['total'] or 0

    # === 2. Tần suất mua trong 90 ngày ===
    ninety_days_ago = timezone.now() - timezone.timedelta(days=90)
    purchase_frequency_90d = successful_orders.filter(
        created_at__gte=ninety_days_ago
    ).count()

    # === 3. Tỷ lệ hoàn hàng: đếm đơn có status = 'returned' ===
    total_returned = Order.objects.filter(user=user, status='returned').count()
    return_rate = round((total_returned / total_orders) * 100, 1) if total_orders > 0 else 0

    # === 4. Tỷ lệ khiếu nại ===
    total_complaints = Complaint.objects.filter(order__user=user).count()
    complaint_rate = round((total_complaints / total_orders) * 100, 1) if total_orders > 0 else 0

    # === 5. Sản phẩm yêu thích (mua nhiều nhất từ đơn thành công) ===
    purchased_products_qs = (
        OrderItem.objects.filter(
            order__user=user,
            order__status__in=['success'],
        )
        .select_related('product')
        .values('product_id', 'product__name', 'product__image')
        .annotate(purchase_count=Sum('quantity'))
        .order_by('-purchase_count')[:5]
    )

    purchased_products = []
    for item in purchased_products_qs:
        image_url = None
        if item['product__image']:
            image_url = request.build_absolute_uri(settings.MEDIA_URL + item['product__image'])
        else:
            image_url = None

        purchased_products.append({
            "id": item['product_id'],
            "name": item['product__name'],
            "image": image_url,
            "purchase_count": item['purchase_count'],
            "view_count": 0  # bạn có thể bỏ nếu chưa có log view
        })

    # === 6. Danh mục quan tâm (danh mục có nhiều đơn nhất) ===
    categories_qs = (
        OrderItem.objects.filter(
            order__user=user,
            order__status__in=['success', 'delivered', 'shipping', 'out_for_delivery', 'ready_to_pick', 'picking']
        )
        .select_related('product__subcategory__category')
        .values('product__subcategory__category_id', 'product__subcategory__category__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    interested_categories = [
        {
            "id": item['product__subcategory__category_id'],
            "name": item['product__subcategory__category__name']
        }
        for item in categories_qs
        if item['product__subcategory__category_id']
    ]

    return Response({
        "total_orders": total_orders,
        "total_spent": int(total_spent),  # React mong đợi số nguyên
        "purchase_frequency_90d": purchase_frequency_90d,
        "return_rate": return_rate,
        "complaint_rate": complaint_rate,
        "purchased_products": purchased_products,
        "interested_categories": interested_categories,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_orders(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    orders = Order.objects.filter(user=user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in [
            'list', 'retrieve', 'create', 
            'seller_pending', 'seller_processing', 
            'seller_success', 'seller_approve', 'seller_complete',
            'seller_cancelled', 'cancel'
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
       # Admin xem tất cả
        if self.action == 'admin_list' and getattr(user, 'is_admin', False):
            pass
        elif self.action == 'get_detail':
            # Không filter theo user — quyền sẽ được kiểm tra trong get_object()
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
                    'product__seller__store_name',
                )
                .annotate(
                    quantity_sold=Sum('quantity'),
                    revenue=Sum('price'),
                    # ✅ Lấy ảnh đầu tiên của sản phẩm qua Subquery
                    first_image=Subquery(
                        ProductImage.objects.filter(product=OuterRef('product_id'))
                        .values('image')[:1]
                    ),
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

    @action(detail=True, methods=["get"], url_path="detail")
    def get_detail(self, request, pk=None):
        """Lấy chi tiết đơn hàng gồm thông tin khách hàng + danh sách sản phẩm"""
        order = self.get_object()
        serializer = OrderSerializer(order, context={"request": request})
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

    @action(detail=False, methods=['get'], url_path='seller/cancelled')
    def seller_cancelled(self, request):
        """Đơn đã bị hủy"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='cancelled').distinct()
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

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Hủy đơn nếu đang ở trạng thái pending hoặc shipping.
        - Seller: phải sở hữu ít nhất một sản phẩm trong đơn.
        - Buyer: phải là chủ sở hữu đơn hàng.
        """
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

        if order.status not in ['pending', 'shipping']:
            return Response({'error': 'Chỉ hủy được đơn đang chờ xác nhận hoặc đang giao'}, status=400)

        user = request.user

        # Buyer: chủ sở hữu đơn được hủy trực tiếp
        if order.user_id == user.id:
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            return Response({'message': 'Đơn hàng đã được hủy', 'status': order.status})

        # Seller: cần sở hữu ít nhất một sản phẩm trong đơn
        seller = getattr(user, 'seller', None)
        if seller:
            from products.models import Product
            seller_product_ids = set(
                Product.objects.filter(seller=seller).values_list('id', flat=True)
            )
            order_product_ids = set(order.items.values_list('product_id', flat=True))
            if seller_product_ids.intersection(order_product_ids):
                order.status = 'cancelled'
                order.save(update_fields=['status'])
                return Response({'message': 'Đơn hàng đã được hủy', 'status': order.status})
            return Response({'error': 'Bạn không có quyền với đơn hàng này'}, status=403)

        return Response({'error': 'Bạn không có quyền hủy đơn hàng này'}, status=403)

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



class PreorderDeleteView(generics.DestroyAPIView):
    """
    Xóa sản phẩm đặt trước (chỉ người đặt mới được xóa)
    """
    queryset = Preorder.objects.all()
    serializer_class = PreOrderSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        preorder_id = kwargs.get("pk")
        preorder = Preorder.objects.filter(id=preorder_id, user=request.user).first()
        if not preorder:
            return Response(
                {"error": "Không tìm thấy đơn đặt trước"},
                status=status.HTTP_404_NOT_FOUND
            )

        preorder.delete()
        return Response(
            {"message": "Xóa đặt trước thành công"},
            status=status.HTTP_204_NO_CONTENT
        )
    
class PreorderListCreateView(generics.ListCreateAPIView):
    queryset = Preorder.objects.all()
    serializer_class = PreOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Preorder.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        product = self.request.data.get("product")
        quantity = int(self.request.data.get("quantity", 1))

        preorder, created = Preorder.objects.get_or_create(
            user=self.request.user,
            product_id=product,
            defaults={"quantity": quantity}
        )

        if not created:
            preorder.quantity += quantity
            preorder.save()
        return preorder

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        preorder = self.perform_create(serializer)
        output_serializer = PreOrderSerializer(preorder, context=self.get_serializer_context())

        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request  # ✅ để build_absolute_uri hoạt động
        return context


# 📊 Thống kê doanh thu cho admin
@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_report(request):
    """
    Lấy dữ liệu thống kê doanh thu
    Params: start_date, end_date (YYYY-MM-DD)
    Bao gồm: doanh thu từ đơn hàng thành công và doanh thu sàn (commission)
    """
    from datetime import datetime
    from products.models import Category

    # Get date range từ query params
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not start_date or not end_date:
        return Response({"error": "start_date and end_date required"}, status=400)

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return Response({"error": "Invalid date format (use YYYY-MM-DD)"}, status=400)

    # Query orders
    orders = Order.objects.filter(
        created_at__date__gte=start.date(),
        created_at__date__lte=end.date()
    )

    # Tính toán stats
    success_orders = orders.filter(status='success')
    pending_orders = orders.filter(status__in=['pending', 'processing', 'shipping'])
    cancelled_orders = orders.filter(status='cancelled')

    total_revenue = success_orders.aggregate(total=Sum('total_price'))['total'] or 0

    # Tính doanh thu sàn (commission)
    # Duyệt qua từng order item và tính commission dựa trên category
    platform_revenue = 0.0
    
    success_order_items = OrderItem.objects.filter(
        order__status='success',
        order__created_at__date__gte=start.date(),
        order__created_at__date__lte=end.date()
    ).select_related('product', 'product__category')
    
    for item in success_order_items:
        if item.product and item.product.category:
            category = item.product.category
            commission_rate = category.commission_rate  # Lấy commission_rate từ category
            item_amount = float(item.price) * item.quantity
            commission = item_amount * commission_rate
            platform_revenue += commission

    # Group by date for chart
    daily_revenue = success_orders.values(
        date=TruncDate('created_at')
    ).annotate(
        revenue=Sum('total_price')
    ).order_by('date')
    
    # Tính daily platform revenue (commission)
    daily_platform_revenue = []
    for day in daily_revenue:
        day_items = OrderItem.objects.filter(
            order__status='success',
            order__created_at__date=day['date']
        ).select_related('product', 'product__category')
        
        day_commission = 0.0
        for item in day_items:
            if item.product and item.product.category:
                category = item.product.category
                commission_rate = category.commission_rate
                item_amount = float(item.price) * item.quantity
                commission = item_amount * commission_rate
                day_commission += commission
        
        daily_platform_revenue.append({
            'date': day['date'].isoformat(),
            'revenue': float(day['revenue'] or 0),
            'platform_revenue': day_commission
        })

    return Response({
        'total_revenue': float(total_revenue),
        'platform_revenue': platform_revenue,  # Doanh thu sàn (commission)
        'success_orders_count': success_orders.count(),
        'pending_orders_count': pending_orders.count(),
        'cancelled_orders_count': cancelled_orders.count(),
        'daily_revenue': daily_platform_revenue
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_statistics_report(request):
    """
    Lấy dữ liệu thống kê đơn hàng cho báo cáo admin
    """
    # Tổng đơn hàng
    total_orders = Order.objects.count()

    # Tổng doanh thu (chỉ tính đơn thành công)
    total_revenue = Order.objects.filter(
        status__in=['success', 'delivered']
    ).aggregate(total=Sum('total_price'))['total'] or 0

    # Tỷ lệ giao đúng hẹn (giả sử đơn success/delivered là đúng hẹn)
    successful_deliveries = Order.objects.filter(
        status__in=['success', 'delivered']
    ).count()
    on_time_rate = round((successful_deliveries / total_orders * 100), 1) if total_orders > 0 else 0

    # Tỷ lệ hủy
    cancelled_orders = Order.objects.filter(status='cancelled').count()
    cancel_rate = round((cancelled_orders / total_orders * 100), 1) if total_orders > 0 else 0

    # Dữ liệu trạng thái đơn hàng cho biểu đồ tròn
    order_status_data = Order.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')

    # Map status to Vietnamese labels
    status_labels = {
        'pending': 'Chờ xử lý',
        'shipping': 'Đang giao',
        'success': 'Hoàn tất',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy',
        'ready_to_pick': 'Sẵn sàng lấy',
        'picking': 'Đang lấy',
        'out_for_delivery': 'Đang giao',
        'delivery_failed': 'Giao thất bại',
        'lost': 'Mất hàng',
        'damaged': 'Hỏng hóc',
        'returned': 'Trả lại'
    }

    order_status_chart_data = [
        {
            'name': status_labels.get(item['status'], item['status']),
            'value': item['count']
        }
        for item in order_status_data
    ]

    # Dữ liệu hiệu suất giao hàng theo ngày trong tuần (mock data cho giờ)
    # Trong thực tế, cần có trường thời gian giao hàng thực tế
    delivery_time_data = [
        {'name': 'T7', 'avg': 2.1, 'late': 15},
        {'name': 'CN', 'avg': 2.5, 'late': 21},
        {'name': 'T2', 'avg': 1.9, 'late': 10},
        {'name': 'T3', 'avg': 2.2, 'late': 13},
        {'name': 'T4', 'avg': 2.3, 'late': 18},
        {'name': 'T5', 'avg': 2.0, 'late': 12},
        {'name': 'T6', 'avg': 2.4, 'late': 16},
    ]

    # Dữ liệu chi phí vận chuyển theo đơn vị giao hàng (mock data)
    # Trong thực tế, cần tích hợp với API GHN hoặc lưu trong database
    shipping_cost_data = [
        {'name': 'GHN', 'cost': 1200000},
        {'name': 'GHTK', 'cost': 1500000},
        {'name': 'Viettel Post', 'cost': 900000},
        {'name': 'J&T', 'cost': 1100000},
    ]

    return Response({
        'orderSummary': {
            'totalOrders': total_orders,
            'revenue': float(total_revenue),
            'onTimeRate': on_time_rate,
            'cancelRate': cancel_rate,
        },
        'orderStatusData': order_status_chart_data,
        'deliveryTimeData': delivery_time_data,
        'shippingCostData': shipping_cost_data,
    })


def order_notifications_sse(request):
    """
    SSE endpoint for real-time order notifications for admins
    """
    # Authenticate user from token in query params
    token = request.GET.get('token')
    if not token:
        return Response({'error': 'Token required'}, status=401)

    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth import get_user_model
        User = get_user_model()
        access_token = AccessToken(token)
        user = User.objects.get(id=access_token['user_id'])
        request.user = user
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=401)

    if not getattr(request.user, 'is_admin', False):
        return Response({'error': 'Chỉ admin mới có quyền'}, status=403)

    def event_stream():
        last_id = 0
        while True:
            # Get new orders since last check
            new_orders = Order.objects.filter(id__gt=last_id).order_by('id')[:10]  # Limit to prevent overload
            if new_orders.exists():
                for order in new_orders:
                    data = {
                        'type': 'new_order',
                        'order_id': order.id,
                        'customer_name': order.customer_name,
                        'total_price': float(order.total_price),
                        'status': order.status,
                        'created_at': order.created_at.isoformat()
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    last_id = max(last_id, order.id)
            time.sleep(1)  # Check every second

    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response
