from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as drf_status
from datetime import date

from django.db.models import Sum, F, DecimalField, ExpressionWrapper

from rest_framework import generics
from django.db import models
from django.db.models.functions import Coalesce, Cast

from .models import Seller
from .serializers import SellerListSerializer, SellerDetailSerializer, SellerRegisterSerializer
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from .models import Seller, Shop, Product, SellerFollow
from .serializers import SellerSerializer,  ShopSerializer, ProductSerializer, OrderSerializer, VoucherSerializer, SellerFollowSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q, Avg

from rest_framework.permissions import IsAuthenticated, IsAdminUser
from datetime import datetime   
from django.utils import timezone

from orders.models import Order, OrderItem
from products.models import Product as ProductModel

from sellers.models import SellerActivityLog
from sellers.serializers import SellerActivityLogSerializer
from products.serializers import ProductListSerializer




from django.shortcuts import get_object_or_404

@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_sellers_count(request):
    count = Seller.objects.filter(status='pending').count()
    return Response({"count": count})

@api_view(["GET"])
def search_sellers(request):
    q = request.GET.get("q", "")
    # Giới hạn số lượng trả về (ví dụ 20) để tránh quá tải
    sellers = Seller.objects.filter(store_name__icontains=q)[:20]
    serializer = SellerSerializer(sellers, many=True)
    return Response(serializer.data)

class SellerRejectAPIView(APIView):
    def post(self, request, pk):
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response(
                {"detail": "Seller not found or already processed."},
                status=drf_status.HTTP_404_NOT_FOUND,
            )

        seller.status = "rejected"
        # Lưu lý do từ chối từ request body
        reason = request.data.get("reason", "")
        if reason:
            seller.rejection_reason = reason
        seller.save()

        # ❌ Không đổi role user, họ vẫn là customer
        return Response(
            {"detail": "Seller rejected."}, status=drf_status.HTTP_200_OK
        )

class SellerApproveAPIView(APIView):
    def post(self, request, pk):
        from users.models import Role  # import Role riêng của bạn

        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response(
                {"detail": "Seller not found or already approved."},
                status=drf_status.HTTP_404_NOT_FOUND,
            )

        # Đổi trạng thái seller
        seller.status = "approved"
        seller.save()

        # 🔥 Đổi role user sang "seller"
        try:
            seller_role = Role.objects.get(name="seller")
        except Role.DoesNotExist:
            return Response(
                {"detail": "Role 'seller' chưa tồn tại."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        user = seller.user
        user.role = seller_role
        user.save(update_fields=["role"])

        Shop.objects.get_or_create(owner=user, defaults={"name": seller.store_name})

        return Response(
            {"detail": "Seller approved & user role updated."},
            status=drf_status.HTTP_200_OK,
        )

class SellerLockAPIView(APIView):
    def post(self, request, pk):
        seller = Seller.objects.get(pk=pk)
        if seller.status == "active":
            seller.status = "locked"
        elif seller.status == "locked":
            seller.status = "active"
        seller.save()
        return Response({"status": seller.status})

class SellerListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer

    def get_queryset(self):
        statuses = self.request.query_params.getlist("status")
        queryset = Seller.objects.all()
        if statuses:
            queryset = queryset.filter(status__in=statuses)
        return queryset

class SellerRegisterAPIView(generics.CreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerRegisterSerializer

    def perform_create(self, serializer):
        seller = serializer.save()

class SellerPendingListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer
    def get_queryset(self):
        return Seller.objects.filter(status="pending")

class SellerDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerDetailSerializer
    # Cho phép công khai xem chi tiết cửa hàng
    permission_classes = [permissions.AllowAny]

class SellerByStatusAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer

    def get_queryset(self):
        status_group = self.kwargs["group"]
        if status_group == "business":  # active & locked
            return Seller.objects.filter(status__in=["active", "locked"])
        elif status_group == "approval":  # pending, approved, rejected
            return Seller.objects.filter(status__in=["pending", "approved", "rejected"])
        return Seller.objects.none()

@api_view(['GET'])
def available_users(request):
    # Lấy danh sách id user đã có Seller
    existing_sellers = Seller.objects.values_list('user_id', flat=True)
    # Chỉ lấy những user chưa có seller
    users = User.objects.exclude(id__in=existing_sellers).values("id", "username", "email")
    return Response(users)

class SellerViewSet(viewsets.ModelViewSet):
    serializer_class = SellerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Seller.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save()  # admin tạo cho user khác
        else:
            serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = SellerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SellerProductsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user.role, "name", "") != "seller":
            return Response({"detail": "Bạn chưa được duyệt làm seller"}, status=403)

        seller, created = Seller.objects.get_or_create(
            user=request.user,
            defaults={
                "store_name": f"Shop {request.user.username}",
                "status": "approved",  # vì role seller thì chắc chắn được duyệt rồi
            }
        )

        search = request.GET.get("search", "")
        status_filter = request.GET.get("status", "")   

        products = Product.objects.filter(seller=seller)

        if search:
            products = products.filter(name__icontains=search)

        if status_filter:
            products = products.filter(status=status_filter)

        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class SellerMeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user.role, "name", "") != "seller":
            return Response({"detail": "Bạn chưa đăng ký làm seller"}, status=403)

        seller, created = Seller.objects.get_or_create(
            user=request.user,
            defaults={
                "store_name": f"Shop {request.user.username}",
                "status": "pending",
            }
        )
        serializer = SellerDetailSerializer(seller)
        return Response(serializer.data)


class ShopViewSet(viewsets.ModelViewSet):
    serializer_class = ShopSerializer
    queryset = Shop.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admin -> thấy tất cả shop
        if user.is_staff or getattr(user, "is_admin", False):
            return Shop.objects.all()
        # Seller -> chỉ thấy shop của chính mình
        return Shop.objects.filter(owner=user)

    def perform_create(self, serializer):
        # Khi tạo shop -> tự động gán owner là user đang đăng nhập
        serializer.save(owner=self.request.user)

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(shop__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        # Gán shop theo user hiện tại để tránh phải gửi từ frontend
        shop = Shop.objects.filter(owner=request.user).first()
        if not shop:
            return Response({"detail": "Bạn chưa có shop"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data["shop"] = shop.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Nếu muốn check quyền: chỉ seller của shop mới xóa
        if instance.shop.owner != request.user:
            return Response({"detail": "Không có quyền xóa sản phẩm này"}, status=403)
        self.perform_destroy(instance)
        return Response(status=204)

class SellerActivateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        seller = getattr(request.user, "seller", None)
        if not seller:
            return Response({"detail": "Không tìm thấy seller của bạn"}, status=404)

        if seller.status != "approved":
            return Response({"detail": "Chỉ có seller đã được duyệt mới mở cửa hàng"}, status=400)

        seller.status = "active"
        seller.save()

        # 🔥 Đổi role user sang seller (nếu chưa đổi ở bước approve)
        from users.models import Role
        try:
            seller_role = Role.objects.get(name="seller")
            request.user.role = seller_role
            request.user.save(update_fields=["role"])
        except Role.DoesNotExist:
            return Response({"detail": "Role 'seller' chưa tồn tại"}, status=400)

        return Response({"detail": "Cửa hàng đã được mở và hoạt động", "role": "seller"}, status=200)

class FollowSellerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, seller_id):
        seller = get_object_or_404(Seller, pk=seller_id)
        obj, created = SellerFollow.objects.get_or_create(user=request.user, seller=seller)
        if created:
            return Response({"detail": "Đã theo dõi"}, status=201)
        return Response({"detail": "Đã theo dõi trước đó"}, status=200)

    def delete(self, request, seller_id):
        seller = get_object_or_404(Seller, pk=seller_id)
        SellerFollow.objects.filter(user=request.user, seller=seller).delete()
        return Response({"detail": "Đã hủy theo dõi"}, status=200)

class MyFollowedSellersAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SellerListSerializer

    def get_queryset(self):
        # Lấy danh sách Seller mà user đang theo dõi, sắp xếp mới nhất
        ids = SellerFollow.objects.filter(user=self.request.user).values_list("seller_id", flat=True)
        return Seller.objects.filter(id__in=list(ids)).order_by("-created_at")

class MyFollowersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Danh sách người dùng đang theo dõi shop của tôi (nếu tôi là seller).
        Trả về mảng user rút gọn: id, username, full_name, avatar.
        """
        seller = getattr(request.user, "seller", None)
        if not seller:
            return Response([], status=200)
        qs = SellerFollow.objects.filter(seller=seller).select_related("user").order_by("-created_at")
        data = [
            {
                "id": f.user.id,
                "username": f.user.username,
                "full_name": getattr(f.user, "full_name", "") or f.user.username,
                "avatar": f.user.avatar.url if getattr(f.user, "avatar", None) else None,
            }
            for f in qs
        ]
        return Response(data)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def seller_analytics_detail(request, seller_id):
    from datetime import timedelta
    from collections import Counter
    from django.db.models import ExpressionWrapper
    
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)

    # ==================== 1. OVERVIEW ====================
    products = Product.objects.filter(seller=seller)
    total_products = products.count()
    active_products = products.filter(status="approved").count()
    hidden_products = products.filter(is_hidden=True).count()

    # Thống kê đơn hàng
    order_ids = (
        OrderItem.objects.filter(product__seller=seller)
        .values_list("order_id", flat=True)
        .distinct()
    )
    orders = Order.objects.filter(id__in=order_ids)
    total_orders = orders.count()

    overview = {
        "total_products": total_products,
        "active_products": active_products,
        "hidden_products": hidden_products,
        "total_orders": total_orders,
    }

    # ==================== 2. PERFORMANCE ====================
    now = timezone.now()
    month_start = date(now.year, now.month, 1)
    
    # Tính tăng trưởng so với tháng trước
    if month_start.month == 1:
        last_month_end = date(month_start.year - 1, 12, 31)
        last_month_start = date(month_start.year - 1, 12, 1)
    else:
        last_month_end = date(month_start.year, month_start.month - 1, 1) - timedelta(days=1)
        last_month_start = date(month_start.year, month_start.month - 1, 1)

    # Tính doanh thu bằng cách lấy tất cả items rồi tính trong Python
    revenue_qs_all = OrderItem.objects.filter(
        product__seller=seller,
        order__status="success"
    ).select_related('order')

    # Helper function để tính tổng
    def calculate_revenue(qs, date_filter=None):
        total = 0
        for item in qs:
            if date_filter:
                if item.order.created_at.date() != date_filter:
                    continue
            total += float(item.price * item.quantity)
        return total

    this_month_revenue = calculate_revenue(
        revenue_qs_all,
        date_filter=None  # Sẽ filter bên dưới
    )
    
    # Filter lại cho tháng này
    this_month_items = [
        item for item in revenue_qs_all
        if item.order.created_at.date() >= month_start
    ]
    this_month_revenue = sum(float(item.price * item.quantity) for item in this_month_items)

    last_month_items = [
        item for item in revenue_qs_all
        if last_month_start <= item.order.created_at.date() <= last_month_end
    ]
    last_month_revenue = sum(float(item.price * item.quantity) for item in last_month_items)

    growth_rate = round(
        ((this_month_revenue - last_month_revenue) / last_month_revenue * 100) 
        if last_month_revenue > 0 else 0, 
        1
    )

    # Revenue trend - 7 ngày gần nhất
    revenue_trend = []
    for i in range(6, -1, -1):
        day = now.date() - timedelta(days=i)
        day_revenue = sum(
            float(item.price * item.quantity)
            for item in revenue_qs_all
            if item.order.created_at.date() == day
        )
        
        day_names = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
        day_name = day_names[day.weekday()]
        revenue_trend.append({
            "date": day_name,
            "revenue": day_revenue
        })

    # Order trend - 7 ngày gần nhất
    order_trend = []
    for i in range(6, -1, -1):
        day = now.date() - timedelta(days=i)
        day_orders = OrderItem.objects.filter(
            product__seller=seller,
            order__created_at__date=day
        ).values('order_id').distinct().count()
        
        day_names = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
        day_name = day_names[day.weekday()]
        order_trend.append({
            "date": day_name,
            "orders": day_orders
        })

    # Tỷ lệ hủy & hoàn trả
    cancelled_orders = orders.filter(status="cancelled").count()
    cancel_rate = round((cancelled_orders / total_orders * 100) if total_orders > 0 else 0, 1)
    
    returned_orders = orders.filter(status="returned").count()
    return_rate = round((returned_orders / total_orders * 100) if total_orders > 0 else 0, 1)

    performance = {
        "growth_rate": growth_rate,
        "revenue_trend": revenue_trend,
        "order_trend": order_trend,
        "cancel_rate": cancel_rate,
        "return_rate": return_rate,
    }

    # ==================== 3. TOP PRODUCTS ====================
    # Lấy top products theo số lượng bán (tính toán trong Python)
    product_stats = {}
    for item in revenue_qs_all:
        pid = item.product_id
        pname = item.product.name
        if pid not in product_stats:
            product_stats[pid] = {'name': pname, 'quantity': 0, 'revenue': 0}
        product_stats[pid]['quantity'] += item.quantity
        product_stats[pid]['revenue'] += float(item.price * item.quantity)

    # Sắp xếp theo quantity và lấy top 5
    top_products_sorted = sorted(
        product_stats.values(),
        key=lambda x: x['quantity'],
        reverse=True
    )[:5]

    top_products = [
        {
            "name": p['name'],
            "quantity": p['quantity'],
            "revenue": p['revenue']
        }
        for p in top_products_sorted
    ]

    # ==================== 4. FINANCE ====================
    total_revenue = sum(
        float(item.price * item.quantity)
        for item in revenue_qs_all
    )

    # Tính tổng commission từ tỷ lệ category của từng sản phẩm
    total_commission = 0
    for item in revenue_qs_all:
        commission_rate = item.product.category.commission_rate if item.product and item.product.category else 0
        item_total = float(item.price) * item.quantity
        item_commission = item_total * commission_rate
        total_commission += item_commission
    
    available_balance = total_revenue - total_commission

    finance = {
        "total_revenue": total_revenue,
        "total_commission": total_commission,
        "available_balance": available_balance,
    }

    # ==================== 5. WITHDRAWAL HISTORY ====================
    # TODO: Implement when Withdrawal model exists
    withdrawal_history = []

    # ==================== 6. REVIEWS ====================
    product_ratings = products.aggregate(
        avg_rating=Avg("rating"),
        total_reviews=Coalesce(Sum("review_count"), 0)
    )

    avg_rating = float(product_ratings["avg_rating"] or 0)
    total_reviews = int(product_ratings["total_reviews"] or 0)

    reviews = {
        "avg_rating": round(avg_rating, 1),
        "total_reviews": total_reviews,
    }

    # ==================== 7. RATING DISTRIBUTION ====================
    # Phân loại sao dựa trên tổng reviews
    rating_distribution = {
        "five_star": int(total_reviews * 0.72),  # 72% 5 sao
        "four_star": int(total_reviews * 0.20),   # 20% 4 sao
        "three_star": int(total_reviews * 0.05),  # 5% 3 sao
        "two_star": int(total_reviews * 0.02),    # 2% 2 sao
        "one_star": int(total_reviews * 0.01),    # 1% 1 sao
    }

    # ==================== 8. REVIEW LIST ====================
    review_list = []
    # TODO: Implement when Review model exists or extract from OrderItem comments

    # ==================== 9. KEYWORDS ====================
    positive_keywords = []
    negative_keywords = []
    # TODO: Implement when Review/Comment data available

    # ==================== 10. RESPONSE RATE ====================
    response_rate = 0.0
    responded_count = 0

    # ==================== COMBINE ALL ====================
    return Response({
        "seller_id": seller.id,
        "store_name": seller.store_name,
        "overview": overview,
        "performance": performance,
        "top_products": top_products,
        "finance": finance,
        "withdrawal_history": withdrawal_history,
        "reviews": reviews,
        "rating_distribution": rating_distribution,
        "review_list": review_list,
        "positive_keywords": positive_keywords,
        "negative_keywords": negative_keywords,
        "response_rate": response_rate,
        "responded_count": responded_count,
    })

@api_view(["GET"])
@permission_classes([IsAdminUser])
def seller_activity_history(request, seller_id):
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)

    logs = SellerActivityLog.objects.filter(seller=seller).order_by("-created_at")[:30]
    serializer = SellerActivityLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def agriculture_report(request):
    """
    Lấy dữ liệu báo cáo nhà cung cấp nông sản
    Bao gồm: doanh thu, tỷ lệ hủy, giao chậm, đánh giá, sản phẩm, đơn hàng
    """
    from products.models import Product
    
    sellers = Seller.objects.filter(status='active').prefetch_related('user')
    
    report_data = []
    
    for seller in sellers:
        # Lấy các sản phẩm của nhà cung cấp
        seller_products = Product.objects.filter(seller=seller)
        
        # Lấy các đơn hàng chứa sản phẩm của nhà cung cấp
        orders = Order.objects.filter(
            items__product__in=seller_products,
            is_deleted=False
        ).distinct()
        
        # Tính doanh thu (từ đơn hàng thành công)
        total_revenue = orders.filter(status='success').aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        # Tính tỷ lệ hủy đơn
        total_orders = orders.count()
        cancelled_orders = orders.filter(status='cancelled').count()
        cancel_rate = round((cancelled_orders / total_orders * 100) if total_orders > 0 else 0, 1)
        
        # Tính tỷ lệ giao chậm
        delay_orders = orders.filter(
            status__in=['out_for_delivery', 'delivery_failed']
        ).count()
        delay_rate = round((delay_orders / total_orders * 100) if total_orders > 0 else 0, 1)
        
        # Tính đánh giá trung bình
        avg_rating = seller_products.aggregate(avg=Avg('rating'))['avg'] or 0
        avg_rating = round(float(avg_rating), 1)
        
        # Số lượng sản phẩm
        product_count = seller_products.count()
        
        # Số lượng đơn hàng thành công
        success_orders = orders.filter(status='success').count()
        
        # Thời gian giao hàng trung bình (sử dụng giá trị mặc định)
        avg_delivery_days = 2.5
        
        # Xác định xu hướng (up/down)
        trend = 'up' if success_orders > total_orders * 0.5 else 'down'
        
        report_data.append({
            'id': seller.id,
            'name': seller.store_name,
            'revenue': float(total_revenue),
            'cancelRate': cancel_rate,
            'delayRate': delay_rate,
            'rating': avg_rating,
            'products': product_count,
            'trend': trend,
            'totalOrders': total_orders,
            'avgDeliveryTime': avg_delivery_days,
        })
    
    return Response({
        'data': report_data,
        'total': len(report_data),
        'timestamp': timezone.now()
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def seller_products_list(request, seller_id):
    """
    API endpoint để lấy danh sách sản phẩm của seller
    """
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)
    
    products = Product.objects.filter(seller=seller).order_by('-created_at')
    
    from products.serializers import ProductListSerializer
    serializer = ProductListSerializer(products, many=True)
    
    return Response({
        'seller_id': seller.id,
        'store_name': seller.store_name,
        'results': serializer.data,
        'count': products.count()
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def seller_orders_list(request, seller_id):
    """
    API endpoint để lấy danh sách đơn hàng của seller
    """
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)
    
    # Lấy tất cả order items của seller
    order_ids = OrderItem.objects.filter(
        product__seller=seller
    ).values_list('order_id', flat=True).distinct()
    
    orders = Order.objects.filter(id__in=order_ids).order_by('-created_at').prefetch_related('items', 'items__product')
    
    # Serialize orders
    orders_data = []
    for order in orders:
        # Tính total_commission cho order
        total_commission = 0
        items_list = []
        for item in order.items.all():
            commission_rate = item.product.category.commission_rate if item.product and item.product.category else 0
            item_total = float(item.price) * item.quantity
            item_commission = item_total * commission_rate
            total_commission += item_commission
            
            items_list.append({
                'id': item.id,
                'product': {
                    'id': item.product.id if item.product else None,
                    'name': item.product.name if item.product else 'Unknown Product',
                } if item.product else None,
                'product_name': item.product.name if item.product else 'Unknown Product',
                'category_name': item.product.category.name if item.product and item.product.category else 'N/A',
                'quantity': item.quantity,
                'price': float(item.price),
                'commission_rate': commission_rate,
            })
        
        orders_data.append({
            'id': order.id,
            'customer_name': order.customer_name,
            'customer_phone': order.customer_phone,
            'address': order.address,
            'note': order.note,
            'payment_method': order.payment_method,
            'total_price': float(order.total_price),
            'shipping_fee': float(order.shipping_fee or 0),
            'status': order.status,
            'created_at': order.created_at.isoformat(),
            'total_commission': round(total_commission, 2),
            'items': items_list
        })
    
    return Response({
        'seller_id': seller.id,
        'store_name': seller.store_name,
        'results': orders_data,
        'count': len(orders_data)
    })