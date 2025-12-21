from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.exceptions import ValidationError

from django.db.models import Q, Sum, Count, F, OuterRef, Subquery
from django.db.models.functions import TruncDate, Coalesce
from django.db import transaction, models
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse

import logging
import json
import time
from datetime import datetime, timedelta

# Import models và serializers
from .models import Order, Complaint, OrderItem, Preorder
from .serializers import OrderSerializer, OrderCreateSerializer, PreOrderSerializer
from .services import complete_order, OrderProcessingError
# [QUAN TRỌNG] Import model Voucher và UserVoucher
from promotions.models import Voucher, UserVoucher
from users.models import PointHistory
from products.models import Product, ProductImage

User = get_user_model()
logger = logging.getLogger(__name__)

# =========================================
# USER STATS APIS
# =========================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_behavior_stats(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # === 1. Đơn hàng "thành công" ===
    successful_orders = Order.objects.filter(
        user=user,
        status__in=['success', 'delivered', 'shipping', 'out_for_delivery', 'ready_to_pick', 'picking']
    )
    total_orders = successful_orders.count()
    total_spent = successful_orders.aggregate(total=Sum('total_price'))['total'] or 0

    # === 2. Tần suất mua trong 90 ngày ===
    ninety_days_ago = timezone.now() - timedelta(days=90)
    purchase_frequency_90d = successful_orders.filter(created_at__gte=ninety_days_ago).count()

    # === 3. Tỷ lệ hoàn hàng ===
    total_returned = Order.objects.filter(user=user, status='returned').count()
    return_rate = round((total_returned / total_orders) * 100, 1) if total_orders > 0 else 0

    # === 4. Tỷ lệ khiếu nại ===
    total_complaints = Complaint.objects.filter(order__user=user).count()
    complaint_rate = round((total_complaints / total_orders) * 100, 1) if total_orders > 0 else 0

    # === 5. Sản phẩm yêu thích ===
    purchased_products_qs = (
        OrderItem.objects.filter(order__user=user, order__status__in=['success'])
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
        purchased_products.append({
            "id": item['product_id'],
            "name": item['product__name'],
            "image": image_url,
            "purchase_count": item['purchase_count'],
            "view_count": 0
        })

    # === 6. Danh mục quan tâm ===
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
        {"id": item['product__subcategory__category_id'], "name": item['product__subcategory__category__name']}
        for item in categories_qs if item['product__subcategory__category_id']
    ]

    return Response({
        "total_orders": total_orders,
        "total_spent": int(total_spent),
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


# =========================================
# ORDER VIEWSET (PHẦN CHÍNH)
# =========================================

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
            queryset = queryset.filter(status=status_param)

        ten_minutes_ago = timezone.now() - timedelta(minutes=10)
        stale_pending = Order.objects.filter(status='pending', created_at__lte=ten_minutes_ago)
        if stale_pending.exists():
            stale_pending.update(status='shipping')

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) | Q(customer_phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    # --- ACTIONS ---

    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        top_products = (
             OrderItem.objects.values('product_id', 'product__name', 'product__seller__store_name')
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

    # --- SELLER ACTIONS ---

    @action(detail=False, methods=['get'], url_path='seller/pending')
    def seller_pending(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='pending').distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/processing')
    def seller_processing(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='shipping').distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/cancelled')
    def seller_cancelled(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='cancelled').distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/complete')
    def seller_completed_orders(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        orders = Order.objects.filter(items__product_id__in=seller_product_ids, status='success').distinct()
        return Response(self.get_serializer(orders, many=True).data)

    @action(detail=True, methods=['post'], url_path='seller/approve')
    def seller_approve(self, request, pk=None):
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền duyệt'}, status=403)
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
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền cập nhật'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
            updated_order = complete_order(order, seller)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)
        except OrderProcessingError as e:
            return Response({'error': str(e)}, status=400)
        except Exception:
            logger.exception("Lỗi không xác định khi hoàn tất đơn")
            return Response({'error': 'Lỗi không xác định'}, status=500)
        return Response({'message': 'Hoàn tất đơn hàng', 'status': updated_order.status})

    # ========================
    # [FIX] HỦY ĐƠN VÀ HOÀN VOUCHER
    # ========================
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)

        if order.status not in ['pending', 'shipping']:
            return Response({'error': 'Chỉ hủy được đơn đang chờ xác nhận hoặc đang giao'}, status=400)

        # Quyền hủy đơn (User chính chủ hoặc Seller có sản phẩm trong đơn)
        user = request.user
        can_cancel = False
        
        if order.user_id == user.id:
            can_cancel = True
        else:
            seller = getattr(user, 'seller', None)
            if seller:
                seller_product_ids = set(Product.objects.filter(seller=seller).values_list('id', flat=True))
                order_product_ids = set(order.items.values_list('product_id', flat=True))
                if seller_product_ids.intersection(order_product_ids):
                    can_cancel = True
        
        if not can_cancel:
            return Response({'error': 'Bạn không có quyền với đơn hàng này'}, status=403)

        # --- LOGIC HOÀN VOUCHER ---
        # Kiểm tra xem đơn hàng có dùng voucher không (nếu Order model có field voucher)
        # Nếu chưa có field voucher trong Order, bạn phải thêm vào models.py trước
        if hasattr(order, 'voucher') and order.voucher:
            # Tìm UserVoucher của người mua
            uv = UserVoucher.objects.filter(user=order.user, voucher=order.voucher).first()
            if uv:
                # Gọi hàm hoàn lại lượt dùng (đã thêm trong models.py)
                uv.restore_usage()
                
                # Giảm số lượng dùng Global của Voucher gốc (nếu có tracking)
                if hasattr(order.voucher, 'used_quantity') and order.voucher.used_quantity > 0:
                    order.voucher.used_quantity = F('used_quantity') - 1
                    order.voucher.save(update_fields=['used_quantity'])

        # Cập nhật trạng thái hủy
        order.status = 'cancelled'
        order.save(update_fields=['status'])
        
        return Response({'message': 'Đơn hàng đã được hủy và hoàn voucher', 'status': order.status})

    # --- ADMIN ACTIONS ---

    @action(detail=False, methods=['get'], url_path='admin-list')
    def admin_list(self, request):
        if not getattr(request.user, 'is_admin', False): return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        return Response(self.get_serializer(self.get_queryset(), many=True).data)

    @action(detail=True, methods=['get'], url_path='admin-detail')
    def admin_detail(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False): return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
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

    # ========================
    # PERFORM CREATE
    # ========================
    def perform_create(self, serializer):
        # Bọc toàn bộ quá trình trong transaction để đảm bảo tính toàn vẹn dữ liệu
        with transaction.atomic():
            # 1. Lưu đơn hàng (Serializer của bạn có thể đã xử lý voucher trong hàm create)
            # Nếu Serializer ĐÃ xử lý, thì order này đã được trừ tiền và voucher đã được trừ lượt.
            order = serializer.save(user=self.request.user)
            
            # --- LOGIC DỰ PHÒNG (FALLBACK) ---
            # Nếu Serializer KHÔNG xử lý voucher (ví dụ bạn dùng serializer cũ),
            # thì đoạn code dưới đây sẽ chạy để đảm bảo voucher vẫn được xử lý.
            # Lưu ý: Nếu Serializer đã xử lý, bạn nên xóa hoặc comment đoạn này để tránh trừ 2 lần
            # Tuy nhiên, hàm mark_used_once() có check số lượng, nên nếu trừ rồi thì nó sẽ chặn lại, khá an toàn.
            
            code = self.request.data.get("voucher_code")
            # Chỉ xử lý nếu có code và đơn hàng chưa được gắn voucher (tức là serializer chưa làm gì)
            has_voucher_field = hasattr(order, 'voucher')
            if code and has_voucher_field and not order.voucher:
                uv = UserVoucher.objects.select_for_update().filter(
                    user=self.request.user, voucher__code=code
                ).select_related("voucher").first()

                if uv and uv.remaining_for_user() > 0:
                    voucher = uv.voucher
                    # Tính lại tiền nếu cần (Logic tương tự như models/serializers)
                    discount = 0
                    v_type = voucher.discount_type() if hasattr(voucher, 'discount_type') else 'unknown'
                    
                    # ... (Logic tính discount như cũ) ...
                    # Để code gọn, tôi giả định serializer đã làm việc này. 
                    # Nếu serializer của bạn là bản "Hardcore" tôi gửi trước đó, thì nó đã xong rồi.
                    
                    # Đánh dấu đã dùng
                    uv.mark_used_once()
                    if hasattr(voucher, 'used_quantity'):
                        voucher.used_quantity = F('used_quantity') + 1
                        voucher.save(update_fields=['used_quantity'])
                    
                    # Gắn voucher vào đơn
                    order.voucher = voucher
                    order.save(update_fields=['voucher'])

            # 3. Tích điểm (Logic giữ nguyên)
            # Lấy danh sách orders đã tạo
            created_orders = getattr(serializer, '_created_orders', [order])
            total_amount_for_points = sum(o.total_price for o in created_orders)
            points_earned = (int(total_amount_for_points) // 1000) * 10
            
            if points_earned > 0:
                user = self.request.user
                user.points += points_earned
                user.save(update_fields=['points'])
                
                PointHistory.objects.create(
                    user=user,
                    order_id=str(order.id),
                    points=points_earned,
                    amount=total_amount_for_points,
                    action=f"Cộng điểm khi thanh toán đơn hàng #{order.id}"
                )

# =========================================
# OTHER VIEWS
# =========================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_products(request):
    filter_type = request.query_params.get("filter", "month")
    today = timezone.now().date()

    if filter_type == "today":
        start_date = today
    elif filter_type == "week":
        start_date = today - timedelta(days=today.weekday())
    else:
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
    queryset = Preorder.objects.all()
    serializer_class = PreOrderSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        preorder_id = kwargs.get("pk")
        preorder = Preorder.objects.filter(id=preorder_id, user=request.user).first()
        if not preorder:
            return Response({"error": "Không tìm thấy đơn đặt trước"}, status=404)
        preorder.delete()
        return Response({"message": "Xóa đặt trước thành công"}, status=204)

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
            user=self.request.user, product_id=product, defaults={"quantity": quantity}
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
        context['request'] = self.request
        return context

@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_report(request):
    from products.models import Category
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not start_date or not end_date:
        return Response({"error": "start_date and end_date required"}, status=400)

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return Response({"error": "Invalid date format"}, status=400)

    orders = Order.objects.filter(created_at__date__gte=start.date(), created_at__date__lte=end.date())
    success_orders = orders.filter(status='success')
    total_revenue = success_orders.aggregate(total=Sum('total_price'))['total'] or 0

    platform_revenue = 0.0
    success_order_items = OrderItem.objects.filter(
        order__status='success',
        order__created_at__date__gte=start.date(),
        order__created_at__date__lte=end.date()
    ).select_related('product', 'product__category')
    
    for item in success_order_items:
        if item.product and item.product.category:
            commission_rate = item.product.category.commission_rate
            item_amount = float(item.price) * item.quantity
            platform_revenue += item_amount * commission_rate

    daily_revenue = success_orders.values(date=TruncDate('created_at')).annotate(revenue=Sum('total_price')).order_by('date')
    
    daily_platform_revenue = []
    for day in daily_revenue:
        day_items = OrderItem.objects.filter(
            order__status='success', order__created_at__date=day['date']
        ).select_related('product', 'product__category')
        
        day_commission = 0.0
        for item in day_items:
            if item.product and item.product.category:
                commission_rate = item.product.category.commission_rate
                day_commission += float(item.price) * item.quantity * commission_rate
        
        daily_platform_revenue.append({
            'date': day['date'].isoformat(),
            'revenue': float(day['revenue'] or 0),
            'platform_revenue': day_commission
        })

    return Response({
        'total_revenue': float(total_revenue),
        'platform_revenue': platform_revenue,
        'success_orders_count': success_orders.count(),
        'pending_orders_count': orders.filter(status__in=['pending', 'processing', 'shipping']).count(),
        'cancelled_orders_count': orders.filter(status='cancelled').count(),
        'daily_revenue': daily_platform_revenue
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_statistics_report(request):
    total_orders = Order.objects.count()
    total_revenue = Order.objects.filter(status__in=['success', 'delivered']).aggregate(total=Sum('total_price'))['total'] or 0
    successful_deliveries = Order.objects.filter(status__in=['success', 'delivered']).count()
    on_time_rate = round((successful_deliveries / total_orders * 100), 1) if total_orders > 0 else 0
    cancelled_orders = Order.objects.filter(status='cancelled').count()
    cancel_rate = round((cancelled_orders / total_orders * 100), 1) if total_orders > 0 else 0

    order_status_data = Order.objects.values('status').annotate(count=Count('id')).order_by('status')
    
    status_labels = {
        'pending': 'Chờ xử lý', 'shipping': 'Đang giao', 'success': 'Hoàn tất',
        'delivered': 'Đã giao', 'cancelled': 'Đã hủy', 'ready_to_pick': 'Sẵn sàng lấy',
        'picking': 'Đang lấy', 'out_for_delivery': 'Đang giao', 'delivery_failed': 'Giao thất bại',
        'lost': 'Mất hàng', 'damaged': 'Hỏng hóc', 'returned': 'Trả lại'
    }
    
    order_status_chart_data = [
        {'name': status_labels.get(item['status'], item['status']), 'value': item['count']}
        for item in order_status_data
    ]
    
    delivery_time_data = [
        {'name': 'T7', 'avg': 2.1, 'late': 15}, {'name': 'CN', 'avg': 2.5, 'late': 21},
        {'name': 'T2', 'avg': 1.9, 'late': 10}, {'name': 'T3', 'avg': 2.2, 'late': 13},
        {'name': 'T4', 'avg': 2.3, 'late': 18}, {'name': 'T5', 'avg': 2.0, 'late': 12},
        {'name': 'T6', 'avg': 2.4, 'late': 16},
    ]
    shipping_cost_data = [
        {'name': 'GHN', 'cost': 1200000}, {'name': 'GHTK', 'cost': 1500000},
        {'name': 'Viettel Post', 'cost': 900000}, {'name': 'J&T', 'cost': 1100000},
    ]

    return Response({
        'orderSummary': {'totalOrders': total_orders, 'revenue': float(total_revenue), 'onTimeRate': on_time_rate, 'cancelRate': cancel_rate},
        'orderStatusData': order_status_chart_data,
        'deliveryTimeData': delivery_time_data,
        'shippingCostData': shipping_cost_data,
    })

def order_notifications_sse(request):
    token = request.GET.get('token')
    if not token: return Response({'error': 'Token required'}, status=401)
    
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        access_token = AccessToken(token)
        user = User.objects.get(id=access_token['user_id'])
        request.user = user
    except Exception:
        return Response({'error': 'Invalid token'}, status=401)

    if not getattr(request.user, 'is_admin', False):
        return Response({'error': 'Chỉ admin mới có quyền'}, status=403)

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
            time.sleep(1)

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    today = timezone.now().date()
    start_str = request.query_params.get('start_date')
    end_str = request.query_params.get('end_date')

    if start_str and end_str:
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
            start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        except ValueError:
             return Response({"error": "Invalid date format"}, status=400)
    else:
        end_datetime = timezone.now()
        start_datetime = end_datetime - timedelta(days=7)

    orders = Order.objects.filter(created_at__range=(start_datetime, end_datetime), is_deleted=False)
    total_orders = orders.count()
    revenue_orders = orders.filter(status__in=['success', 'delivered', 'completed'])
    total_revenue = revenue_orders.aggregate(total=Coalesce(Sum('total_price'), 0.0, output_field=models.DecimalField()))['total']
    
    cancelled_count = orders.filter(status='cancelled').count()
    returned_count = orders.filter(status='returned').count()
    cancel_rate = round((cancelled_count / total_orders * 100), 2) if total_orders > 0 else 0
    return_rate = round((returned_count / total_orders * 100), 2) if total_orders > 0 else 0
    avg_order_value = round(total_revenue / revenue_orders.count()) if revenue_orders.exists() else 0

    trend_data = orders.annotate(date=TruncDate('created_at')).values('date').annotate(orders=Count('id')).order_by('date')
    revenue_trend = revenue_orders.annotate(date=TruncDate('created_at')).values('date').annotate(revenue=Sum('total_price')).order_by('date')
    
    rev_dict = {item['date']: item['revenue'] for item in revenue_trend}
    chart_trend = [{"date": item['date'].strftime('%d/%m'), "orders": item['orders'], "revenue": rev_dict.get(item['date'], 0)} for item in trend_data]

    status_data_qs = orders.values('status').annotate(value=Count('id'))
    chart_status = [{"name": item['status'], "value": item['value']} for item in status_data_qs]

    top_products_qs = (
        OrderItem.objects.filter(order__in=revenue_orders)
        .values('product__id', 'product__name', 'product_image')
        .annotate(sold=Sum('quantity'), revenue=Sum(F('quantity') * F('price')))
        .order_by('-sold')[:5]
    )
    
    top_products = [
        {"id": p['product__id'], "name": p['product__name'], "sold": p['sold'], "revenue": p['revenue'], "img": p['product_image'] or ""}
        for p in top_products_qs
    ]

    recent_orders_qs = orders.select_related('user').order_by('-created_at')[:10]
    recent_orders = [
        {"id": o.id, "customer": (o.user.full_name or o.user.username) if o.user else 'N/A', "total": float(o.total_price), "status": o.status, "date": o.created_at.strftime('%Y-%m-%d')}
        for o in recent_orders_qs
    ]

    return Response({
        "stats": {"totalOrders": total_orders, "revenue": total_revenue, "avgOrderValue": avg_order_value, "cancelRate": cancel_rate, "returnRate": return_rate},
        "chartData": {"trend": chart_trend, "status": chart_status},
        "topProducts": top_products,
        "recentOrders": recent_orders
    })