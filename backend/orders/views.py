from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Q, Sum, Count, F, OuterRef, Subquery, Case, When
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
from django.utils import timezone

from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncDate, Coalesce
from django.db import models


# Import Models
from .models import Order, OrderItem, Preorder
from complaints.models import Complaint
from products.models import Product, ProductImage
from promotions.models import Voucher, UserVoucher
from users.models import PointHistory

# Import Serializers & Services
from .serializers import OrderSerializer, OrderCreateSerializer, PreOrderSerializer
from .services import complete_order, reduce_stock_for_order, OrderProcessingError

User = get_user_model()
logger = logging.getLogger(__name__)


# =========================================================
# USER STATS VIEWS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_behavior_stats(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # === 1. Đơn hàng "thành công" (tính chi tiêu & tần suất) ===
    # Cập nhật status theo model mới: completed, delivered, shipping...
    successful_orders = Order.objects.filter(
        user=user,
        status__in=['completed', 'delivered', 'shipping', 'out_for_delivery', 'ready_to_pick', 'picking']
    )
    total_orders = successful_orders.count()
    total_spent = successful_orders.aggregate(total=Sum('total_price'))['total'] or 0

    # === 2. Tần suất mua trong 90 ngày ===
    ninety_days_ago = timezone.now() - timedelta(days=90)
    purchase_frequency_90d = successful_orders.filter(
        created_at__gte=ninety_days_ago
    ).count()

    # === 3. Tỷ lệ hoàn hàng: status = 'returned' ===
    total_returned = Order.objects.filter(user=user, status='returned').count()
    return_rate = round((total_returned / total_orders) * 100, 1) if total_orders > 0 else 0

    # === 4. Tỷ lệ khiếu nại ===
    total_complaints = Complaint.objects.filter(user=user).count()
    complaint_rate = round((total_complaints / total_orders) * 100, 1) if total_orders > 0 else 0

    # === 5. Sản phẩm yêu thích (mua nhiều nhất từ đơn completed/delivered) ===
    purchased_products_qs = (
        OrderItem.objects.filter( 
            order__user=user,
            order__status__in=['completed', 'delivered'], # Chỉ lấy đơn đã giao hoặc hoàn tất
        )
        .select_related('product')
        .values('product_id', 'product__name', 'product__image') # Model mới dùng product_image snapshot trong OrderItem nếu cần
        .annotate(purchase_count=Sum('quantity'))
        .order_by('-purchase_count')[:5]
    )

    purchased_products = []
    for item in purchased_products_qs:
        # Ưu tiên lấy ảnh từ Product hiện tại, nếu không lấy từ snapshot OrderItem (nếu bạn có lưu snapshot)
        image_url = None
        if item.get('product__image'):
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
            order__status__in=['completed', 'delivered', 'shipping']
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


# =========================================================
# ORDER VIEWSET
# =========================================================

class OrderViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in [
            'list', 'retrieve', 'create', 
            'seller_pending', 'seller_processing', 
            'seller_completed_orders', 'seller_approve', 'seller_complete',
            'seller_cancelled', 'cancel'
        ]:
            return [IsAuthenticated()]
        elif self.action in ['admin_list', 'admin_detail', 'admin_soft_delete', 'admin_restore']:
            return [IsAuthenticated()] # Logic check admin nằm trong method
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        # Mặc định lấy các đơn chưa bị xóa mềm
        queryset = Order.objects.all()

        if self.action == 'admin_list' and getattr(user, 'is_admin', False):
            pass # Admin thấy hết
        elif self.action == 'get_detail':
            pass
        elif user.is_authenticated:
            queryset = queryset.filter(user=user)

            status_param = self.request.query_params.get('status')
            if status_param:
                # === LOGIC DỒN ĐƠN VÀO TAB "TRẢ HÀNG/HOÀN TIỀN" ===
                if status_param == 'return':
                    # Danh sách các trạng thái của ITEM (Sản phẩm) được coi là đang trả/khiếu nại
                    # Bạn phải liệt kê ĐỦ các trạng thái này thì đơn mới hiện lên
                    refund_statuses = [
                        'REFUND_REQUESTED', # Khách vừa gửi yêu cầu
                        'WAITING_RETURN',   # Shop đồng ý, chờ khách gửi (QUAN TRỌNG)
                        'RETURNING',        # Khách đã gửi, đang đi đường
                        'SELLER_REJECTED',  # Shop từ chối (đang cãi nhau)
                        'DISPUTE_TO_ADMIN', # Kiện lên sàn
                        'REFUND_APPROVED',  # Đã hoàn tiền xong
                        'REFUND_REJECTED'   # Kết thúc (Từ chối hoàn)
                    ]
                    
                    # Logic: "Lấy những đơn hàng mả TRONG ĐÓ có ít nhất 1 sản phẩm nằm trong danh sách lỗi trên"
                    # Dùng __in để lọc mảng, dùng distinct() để tránh trùng lặp đơn
                    queryset = queryset.filter(items__status__in=refund_statuses).distinct()
                
                # === CÁC TAB KHÁC (Pending, Shipping, Completed...) ===
                else:
                    # Logic cũ: Lọc theo trạng thái đơn hàng
                    queryset = queryset.filter(status=status_param)
            
            # Sắp xếp đơn mới nhất lên đầu
            return queryset.order_by('-created_at')

        # Auto-approve sau 10 phút và trừ tồn kho
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
            queryset = queryset.filter(
                Q(customer_name__icontains=search) | Q(customer_phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    # --- ACTIONS ---

    @action(detail=False, methods=['get'], url_path='top-products')
    def top_products(self, request):
        """Top sản phẩm bán chạy (dựa trên đơn hàng completed)"""
        top_products = (
             OrderItem.objects
                .filter(order__status='completed') # Đã sửa thành completed
                .values(
                    'product_id',
                    'product__name',
                    'product__seller__store_name',
                )
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
    

    @action(detail=True, methods=['post'], url_path='create_payment_url')
    def create_payment_url(self, request, pk=None):
        """
        Tạo URL thanh toán VNPAY cho đơn hàng
        """
        try:
            order = self.get_object()
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        # Kiểm tra nếu đơn đã thanh toán rồi
        if order.status in ['success', 'shipping', 'delivered']:
            return Response({'error': 'Đơn hàng đã được thanh toán'}, status=400)

        # Tính toán số tiền (VNPAY yêu cầu số tiền * 100)
        amount = int(order.total_price * 100)
        
        # Cấu hình tham số VNPAY
        order_type = "billpayment"
        order_desc = f"Thanh toan don hang {order.id}"
        bank_code = request.data.get('bank_code', '') # Tùy chọn, nếu user chọn bank trước
        language = 'vn'
        ip_addr = get_client_ip(request)

        # Build URL
        vnp = VNPAY()
        vnp.requestData['vnp_Version'] = '2.1.0'
        vnp.requestData['vnp_Command'] = 'pay'
        vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
        vnp.requestData['vnp_Amount'] = amount
        vnp.requestData['vnp_CurrCode'] = 'VND'
        vnp.requestData['vnp_TxnRef'] = str(order.id) # Mã đơn hàng của bạn
        vnp.requestData['vnp_OrderInfo'] = order_desc
        vnp.requestData['vnp_OrderType'] = order_type
        vnp.requestData['vnp_Locale'] = language
        
        # URL Callback (IPN) - Quan trọng: Phải là Public URL (hoặc dùng ngrok nếu localhost)
        # Ví dụ: https://api.yourdomain.com/api/orders/payment_ipn/
        # Ở đây mình không set vnp_IpAddr trong requestData nếu local đôi khi lỗi, tùy config
        vnp.requestData['vnp_CreateDate'] = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        vnp.requestData['vnp_IpAddr'] = ip_addr
        vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL

        if bank_code:
            vnp.requestData['vnp_BankCode'] = bank_code

        vnpay_payment_url = vnp.get_payment_url(settings.VNPAY_URL, settings.VNPAY_HASH_SECRET)

        return Response({'payment_url': vnpay_payment_url})

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

    # ========================
    # Seller APIs
    # ========================
    @action(detail=False, methods=['get'], url_path='seller/pending')
    def seller_pending(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='pending').distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/processing')
    def seller_processing(self, request):
        """Đang vận chuyển"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='shipping').distinct()
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='seller/cancelled')
    def seller_cancelled(self, request):
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        qs = Order.objects.filter(items__product_id__in=seller_product_ids, status='cancelled').distinct()
        return Response(self.get_serializer(qs, many=True).data)
    
    @action(detail=False, methods=['get'], url_path='seller/refunds')
    def seller_refund_orders(self, request):
        """Lấy danh sách đơn hàng có sản phẩm đang khiếu nại hoặc đã hoàn tiền"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền'}, status=403)

        from products.models import Product
        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        
        # Các trạng thái liên quan đến quy trình trả hàng/hoàn tiền
        refund_statuses = [
            'REFUND_REQUESTED', # Khách vừa gửi yêu cầu
            'SELLER_REJECTED',  # Shop từ chối (đang cãi nhau)
            'DISPUTE_TO_ADMIN', # Kiện lên sàn
            'REFUND_APPROVED',  # Đã hoàn tiền xong
            'REFUND_REJECTED'   # Đã chốt là không hoàn (lưu lịch sử)
        ]
        
        # Lọc các đơn hàng có ít nhất 1 item nằm trong danh sách trạng thái trên
        # VÀ item đó phải thuộc về seller hiện tại
        orders = Order.objects.filter(
            items__product_id__in=seller_product_ids, 
            items__status__in=refund_statuses
        ).distinct().order_by('-created_at')
        
        return Response(self.get_serializer(orders, many=True).data)
    
    @action(detail=False, methods=['get'], url_path='seller/complete')
    def seller_completed_orders(self, request):
        """Đơn đã hoàn tất (Completed) và Đã giao (Delivered)"""
        seller = getattr(request.user, 'seller', None)
        if not seller:
            return Response({'error': 'Chỉ seller mới có quyền truy cập'}, status=403)

        seller_product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        
        # === SỬA DÒNG NÀY ===
        # Cũ: chỉ lấy 'completed'
        # orders = Order.objects.filter(items__product_id__in=seller_product_ids, status='completed').distinct()
        
        # Mới: Lấy cả 'delivered' và 'completed'
        orders = Order.objects.filter(
            items__product_id__in=seller_product_ids, 
            status__in=['delivered', 'completed']
        ).distinct()
        # ====================
        
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
        
        try:
            reduce_stock_for_order(order)
        except OrderProcessingError as e:
            logger.error(f"Lỗi trừ tồn kho khi duyệt đơn: {e}")
        
        return Response({'message': 'Đã duyệt đơn', 'status': order.status})

    @action(detail=True, methods=['post'], url_path='seller/complete')
    def seller_complete(self, request, pk=None):
        """Seller xác nhận hoàn tất đơn (Delivered -> Completed)"""
        seller = getattr(request.user, 'seller', None)
        if not seller: return Response({'error': 'Chỉ seller mới có quyền cập nhật'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
            updated_order = complete_order(order, seller)
        except Order.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)
        
        # [MỚI] Kiểm tra tranh chấp
        if order.is_disputed:
            return Response({'error': 'Đơn hàng đang có tranh chấp/khiếu nại, không thể hoàn tất.'}, status=400)

        # Thường thì phải Delivered mới được Completed
        if order.status not in ['delivered', 'shipping']: 
             return Response({'error': 'Đơn hàng chưa giao thành công, không thể hoàn tất'}, status=400)

        try:
            # Service complete_order cần được cập nhật để set status='completed'
            updated_order = complete_order(order, seller)
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
        
        # Buyer hủy
        if order.user_id == user.id:
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            return Response({'message': 'Đơn hàng đã được hủy', 'status': order.status})

        # Seller hủy
        seller = getattr(user, 'seller', None)
        if seller:
            seller_product_ids = set(Product.objects.filter(seller=seller).values_list('id', flat=True))
            order_product_ids = set(order.items.values_list('product_id', flat=True))
            if seller_product_ids.intersection(order_product_ids):
                order.status = 'cancelled'
                order.save(update_fields=['status'])
                return Response({'message': 'Đơn hàng đã được hủy', 'status': order.status})
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

    # ========================
    # Admin APIs (quản lý soft delete)
    # ========================
    @action(detail=False, methods=['get'], url_path='admin-list')
    def admin_list(self, request):
        if not getattr(request.user, 'is_admin', False): return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        return Response(self.get_serializer(self.get_queryset(), many=True).data)

    @action(detail=True, methods=['get'], url_path='admin-detail')
    def admin_detail(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False): return Response({'error': 'Chỉ admin mới có quyền'}, status=403)
        try:
            # Dùng all_objects để tìm cả đơn đã xóa
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

    # ========================
    # Create Order (Voucher + Points)
    # ========================
    def perform_create(self, serializer):
        with transaction.atomic():

            order = serializer.save(user=self.request.user)
           
            code = self.request.data.get("voucher_code")
            # Chỉ xử lý nếu có code và đơn hàng chưa được gắn voucher (tức là serializer chưa làm gì)
            has_voucher_field = hasattr(order, 'voucher')
            if code and has_voucher_field and not order.voucher:
                uv = UserVoucher.objects.select_for_update().filter(
                    user=self.request.user, voucher__code=code
                ).select_related("voucher").first()

                if uv and uv.remaining_for_user() > 0:
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

                    discount = min(discount, float(order.total_price))
                    order.discount_amount = discount  # <--- QUAN TRỌNG: Lưu số tiền giảm
                    order.total_price = float(order.total_price) - discount
                    order.voucher = voucher

                    order.save(update_fields=["total_price", "voucher", "discount_amount"])

                    uv.mark_used_once()
                    if hasattr(voucher, 'used_quantity'):
                        voucher.used_quantity = F('used_quantity') + 1
                        voucher.save(update_fields=['used_quantity'])
                    
                    # Gắn voucher vào đơn
                    order.voucher = voucher
                    order.save(update_fields=['voucher'])

        # Tích điểm
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
                action=f"Cộng điểm khi thanh toán đơn hàng #{order.id}" + (f" và {len(created_orders)-1} đơn khác" if len(created_orders) > 1 else "")
            )

# =========================================
# OTHER VIEWS
# =========================================

# =========================================================
# OTHER PRODUCT API
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_products_filter(request):
    """API riêng lẻ để filter top product"""
    filter_type = request.query_params.get("filter", "month") 
    today = timezone.now().date()

    if filter_type == "today":
        start_date = today
    elif filter_type == "week":
        start_date = today - timedelta(days=today.weekday())
    else: # month
        start_date = today.replace(day=1)

    items = (
        OrderItem.objects
        .filter(order__created_at__date__gte=start_date)
        .values(
            product_id=F("product__id"),
            product_name=F("product__name"),
            shop_name=F("product__seller__store_name"), # Giả sử product có relation seller
            # thumbnail=F("product__thumbnail"), # Nếu model Product có thumbnail
        )
        .annotate(
            quantity_sold=Sum("quantity"),
            revenue=Sum(F("quantity") * F("price"))
            )
        .order_by("-quantity_sold")[:10]
    )
    return Response(list(items))


# =========================================================
# PREORDER VIEWS (Giữ nguyên logic cũ)
# =========================================================

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


# =========================================================
# STATS & REPORT FOR ADMIN
# =========================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_report(request):
    """
    Báo cáo doanh thu (Thay success = completed)
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not start_date or not end_date:
        return Response({"error": "start_date and end_date required"}, status=400)

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return Response({"error": "Invalid date format"}, status=400)

    # Query orders (lọc theo range và chưa xóa)
    orders = Order.objects.filter(
        created_at__date__gte=start.date(),
        created_at__date__lte=end.date(),
        is_deleted=False
    )

    # Thay đổi: Chỉ tính doanh thu đơn 'completed' (Đã đối soát)
    success_orders = orders.filter(status='completed')
    pending_orders = orders.filter(status__in=['pending', 'shipping'])
    cancelled_orders = orders.filter(status='cancelled')

    total_revenue = success_orders.aggregate(total=Sum('total_price'))['total'] or 0

    # Tính doanh thu sàn (Commission) dựa trên success_orders
    platform_revenue = 0.0
    success_order_items = OrderItem.objects.filter(
        order__in=success_orders
    ).select_related('product', 'product__category')
    
    for item in success_order_items:
        if item.product and item.product.category:
            category = item.product.category
            commission_rate = getattr(category, 'commission_rate', 0.0)
            
            # --- ĐOẠN CẦN SỬA ---
            item_amount = float(item.price) * item.quantity
            # Ép kiểu commission_rate sang float
            platform_revenue += item_amount * float(commission_rate)
            # --------------------

    daily_revenue = success_orders.values(date=TruncDate('created_at')).annotate(revenue=Sum('total_price')).order_by('date')
    
    # Tính daily platform revenue
    daily_platform_revenue = []
    for day in daily_revenue:
        day_items = OrderItem.objects.filter(
            order__status='completed', # completed
            order__created_at__date=day['date']
        ).select_related('product', 'product__category')
        
        day_commission = 0.0
        for item in day_items:
            if item.product and item.product.category:
                commission_rate = getattr(item.product.category, 'commission_rate', 0.0)
                
                # --- ĐOẠN CẦN SỬA ---
                item_amount = float(item.price) * item.quantity
                # Ép kiểu commission_rate sang float
                commission = item_amount * float(commission_rate)
                # --------------------
                
                day_commission += commission
        
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
    """
    Thống kê tổng quan cho Admin
    """
    total_orders = Order.objects.count()

    # Tổng doanh thu (chỉ tính completed/delivered cho chắc chắn)
    total_revenue = Order.objects.filter(
        status__in=['completed', 'delivered']
    ).aggregate(total=Sum('total_price'))['total'] or 0

    # Tỷ lệ giao đúng hẹn (Dựa vào status completed/delivered)
    successful_deliveries = Order.objects.filter(
        status__in=['completed', 'delivered']
    ).count()
    on_time_rate = round((successful_deliveries / total_orders * 100), 1) if total_orders > 0 else 0
    cancelled_orders = Order.objects.filter(status='cancelled').count()
    cancel_rate = round((cancelled_orders / total_orders * 100), 1) if total_orders > 0 else 0

    # Biểu đồ trạng thái (Cập nhật Status Map mới)
    order_status_data = Order.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')

    status_labels = {
        'pending': 'Chờ xác nhận',
        'shipping': 'Đang vận chuyển',
        'delivered': 'Đã giao hàng',
        'completed': 'Hoàn thành', # Mới
        'cancelled': 'Đã hủy',
        'returned': 'Trả hàng/Hoàn tiền', # Mới
    }
    
    order_status_chart_data = [
        {'name': status_labels.get(item['status'], item['status']), 'value': item['count']}
        for item in order_status_data
    ]

    # Mock Data cho Delivery Time & Shipping Cost (Giữ nguyên như cũ)
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
    """
    SSE endpoint for real-time order notifications
    """
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
        # Nếu muốn lấy last_id hiện tại để không bắn lại tin cũ:
        # last_order = Order.objects.last()
        # if last_order: last_id = last_order.id
        
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

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """
    Dashboard Stats tổng hợp (Completed used for Revenue)
    """
    today = timezone.now().date()
    start_str = request.query_params.get('start_date')
    end_str = request.query_params.get('end_date')

    if start_str and end_str:
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            end_datetime = datetime.combine(end_date, datetime.max.time())
            end_datetime = timezone.make_aware(end_datetime)
            start_datetime = datetime.combine(start_date, datetime.min.time())
            start_datetime = timezone.make_aware(start_datetime)
        except ValueError:
             return Response({"error": "Invalid date format"}, status=400)
    else:
        end_datetime = timezone.now()
        start_datetime = end_datetime - timedelta(days=7)

    # Base Queryset
    orders = Order.objects.filter(
        created_at__range=(start_datetime, end_datetime),
        is_deleted=False
    )

    # KPI Stats
    total_orders = orders.count()
    
    # Revenue: Chỉ tính Completed
    revenue_orders = orders.filter(status='completed')
    total_revenue = revenue_orders.aggregate(
        total=Coalesce(Sum('total_price'), 0.0, output_field=models.DecimalField())
    )['total']

    # Tỷ lệ
    cancelled_count = orders.filter(status='cancelled').count()
    returned_count = orders.filter(status='returned').count()
    cancel_rate = round((cancelled_count / total_orders * 100), 2) if total_orders > 0 else 0
    return_rate = round((returned_count / total_orders * 100), 2) if total_orders > 0 else 0
    
    avg_order_value = round(total_revenue / revenue_orders.count()) if revenue_orders.exists() else 0

    # Trend Chart
    trend_data = (
        orders
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(orders=Count('id'))
        .order_by('date')
    )

    revenue_trend = (
        revenue_orders
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(revenue=Sum('total_price'))
        .order_by('date')
    )
    
    chart_trend = []
    rev_dict = {item['date']: item['revenue'] for item in revenue_trend}
    
    for item in trend_data:
        chart_trend.append({
            "date": item['date'].strftime('%d/%m'),
            "orders": item['orders'],
            "revenue": rev_dict.get(item['date'], 0)
        })

    # Status Chart
    status_map = {
        'pending': 'Chờ xác nhận', 
        'shipping': 'Đang vận chuyển', 
        'delivered': 'Đã giao hàng',
        'completed': 'Hoàn thành', 
        'cancelled': 'Đã hủy', 
        'returned': 'Trả hàng'
    }
    
    status_data_qs = orders.values('status').annotate(value=Count('id'))
    chart_status = []
    for item in status_data_qs:
        label = status_map.get(item['status'], item['status'])
        chart_status.append({"name": label, "value": item['value']})

    # Payment Methods
    payment_methods_qs = (
        orders
        .values('payment_method')
        .annotate(count=Count('id'))
    )

    payment_methods = []
    for item in payment_methods_qs:
        payment_methods.append({
            "name": item['payment_method'] or "Khác",
            "value": item['count']
        })

    # Top Products
    top_products_qs = (
        OrderItem.objects
        .filter(order__in=revenue_orders)
        .values('product__id', 'product__name') # Bỏ product_image nếu không chắc chắn join, dùng snapshot nếu cần
        .annotate(
            sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('price'))
        )
        .order_by('-sold')[:5]
    )

    top_products = []
    for p in top_products_qs:
        # Lấy ảnh
        img = None
        prod_img = ProductImage.objects.filter(product_id=p['product__id']).first()
        if prod_img:
            img = request.build_absolute_uri(settings.MEDIA_URL + str(prod_img.image))
            
        top_products.append({
            "id": p['product__id'],
            "name": p['product__name'],
            "sold": p['sold'],
            "revenue": p['revenue'],
            "img": img or "https://via.placeholder.com/40"
        })

    # Recent Orders
    recent_orders_qs = orders.select_related('user').order_by('-created_at')[:10]
    recent_orders = []
    for order in recent_orders_qs:
        recent_orders.append({
            "id": order.id,
            "customer": (order.user.full_name or order.user.username) if order.user else 'Khách lạ',    
            "total": float(order.total_price) if order.total_price else 0,
            "status": order.status,
            "date": order.created_at.strftime('%Y-%m-%d')
        })

    return Response({
        "stats": {
            "totalOrders": total_orders,
            "revenue": total_revenue,
            "avgOrderValue": avg_order_value,
            "cancelRate": cancel_rate,
            "returnRate": return_rate
        },
        "chartData": {
            "trend": chart_trend,
            "status": chart_status,
            "paymentMethods": payment_methods,
        },
        "topProducts": top_products,
        "recentOrders": recent_orders
    })


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@api_view(['GET'])
@permission_classes([AllowAny]) # Quan trọng: VNPAY không có token login
def payment_ipn(request):
    """
    VNPAY gọi vào đây để báo trạng thái thanh toán (Server-to-Server)
    """
    inputData = request.GET
    if not inputData:
        return Response({'RspCode': '99', 'Message': 'Invalid Params'})

    vnp = VNPAY()
    vnp.responseData = inputData.dict()

    order_id = inputData.get('vnp_TxnRef')
    amount = inputData.get('vnp_Amount')
    vnp_ResponseCode = inputData.get('vnp_ResponseCode')
    
    # Kiểm tra Checksum
    if vnp.validate_response(settings.VNPAY_HASH_SECRET):
        try:
            # Check DB xem đơn hàng có tồn tại không
            order = Order.objects.get(id=order_id)
            
            # Kiểm tra số tiền (Frontend gửi lên có thể sai, phải check lại)
            if order.total_price * 100 != int(amount):
                 return Response({'RspCode': '04', 'Message': 'Invalid Amount'})
            
            # Kiểm tra xem đơn đã check rồi chưa
            if order.status == 'completed':
                return Response({'RspCode': '02', 'Message': 'Order Already Confirmed'})
            
            if vnp_ResponseCode == '00':
                # --- THANH TOÁN THÀNH CÔNG ---
                order.status = 'shipping'
                order.payment_status = True # Nếu bạn có trường này
                order.save()
                
                # Logic cộng điểm hoặc thông báo seller ở đây (nếu cần)
                
                return Response({'RspCode': '00', 'Message': 'Confirm Success'})
            else:
                # Thanh toán lỗi
                return Response({'RspCode': '00', 'Message': 'Payment Failed'})
                
        except Order.DoesNotExist:
            return Response({'RspCode': '01', 'Message': 'Order Not Found'})
    else:
        # Sai checksum (có thể là giả mạo)
        return Response({'RspCode': '97', 'Message': 'Invalid Checksum'})