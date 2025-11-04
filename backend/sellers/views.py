from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as drf_status
from datetime import date

from django.db.models import Sum, F, DecimalField

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

from sellers.models import SellerActivityLog
from sellers.serializers import SellerActivityLogSerializer
from products.serializers import ProductListSerializer




from django.shortcuts import get_object_or_404

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
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)

    # Thống kê sản phẩm
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
    orders_completed = orders.filter(status="success").count()
    orders_pending = orders.filter(status="pending").count()
    orders_canceled = orders.filter(status="cancelled").count()

    # Tính toán doanh thu
    now = timezone.now()
    # Lấy ngày đầu tháng hiện tại
    month_start = date(now.year, now.month, 1)

    revenue_qs = OrderItem.objects.filter(
        product__seller=seller,
        order__status="success"
    )

    # Tổng doanh thu
    total_revenue = revenue_qs.aggregate(
        total=Coalesce(
            Sum(
                F('price') * F('quantity'),
                output_field=DecimalField(max_digits=20, decimal_places=2)
            ),
            0,
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )
    )['total']

    # Doanh thu tháng này (so sánh theo date thay vì datetime)
    monthly_revenue = revenue_qs.filter(
        order__created_at__date__gte=month_start
    ).aggregate(
        total=Coalesce(
            Sum(
                F('price') * F('quantity'),
                output_field=DecimalField(max_digits=20, decimal_places=2)
            ),
            0,
            output_field=DecimalField(max_digits=20, decimal_places=2)
        )
    )['total']

    print(f"Month start: {month_start}")
    print(f"Orders count this month: {revenue_qs.filter(order__created_at__date__gte=month_start).count()}")

    # Thống kê đánh giá
    review_stats = products.aggregate(
        avg_rating=Avg("rating"),
        total_reviews=Coalesce(Sum("review_count"), 0)
    )
    avg_rating = review_stats["avg_rating"] or 0
    total_reviews = review_stats["total_reviews"] or 0

    return Response({
        "seller_id": seller.id,
        "store_name": seller.store_name,
        "overview": {
            "total_products": total_products,
            "active_products": active_products,
            "hidden_products": hidden_products,
            "total_orders": total_orders,
            "orders_completed": orders_completed,
            "orders_pending": orders_pending,
            "orders_canceled": orders_canceled,
        },
        "finance": {
            "monthly_revenue": float(monthly_revenue),
            "total_revenue": float(total_revenue),
        },
        "reviews": {
            "avg_rating": round(float(avg_rating), 2),
            "total_reviews": int(total_reviews),
        },
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