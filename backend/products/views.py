from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Product, Category
from .serializers import ProductSerializer, ProductListSerializer, CategorySerializer, SubcategorySerializer
from rest_framework.views import APIView
from sellers.models import Seller
from sellers.serializers import SellerSerializer
from rest_framework import generics, permissions
from reviews.models import Review
from reviews.serializers import ReviewSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import action
from .models import Category, Subcategory, Product
from .serializers import CategorySerializer, SubcategorySerializer, ProductListSerializer, CategoryCreateSerializer
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, permissions, status
from django.utils.timezone import now, timedelta
from django.db.models import Sum
from orders.models import OrderItem  # giả sử bảng chi tiết đơn hàng tên là OrderItem
from django.db.models.functions import Concat
from django.contrib.postgres.search import TrigramSimilarity
from orders.models import Preorder
    

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def products_by_seller(request, seller_id):
    if not request.user.is_staff:  # chỉ admin
        return Response({"detail": "Không có quyền"}, status=403)

    products = Product.objects.filter(shop__owner__seller__id=seller_id)
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_approve_products(request):
    product_ids = request.data.get("product_ids", [])
    if not product_ids:
        return Response({"detail": "No product IDs provided"}, status=400)

    products = Product.objects.filter(id__in=product_ids, status='pending')
    count = products.update(status='approved')
    return Response({"approved_count": count})

class SubcategoryViewSet(viewsets.ModelViewSet):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer
    permission_classes = [AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Product.objects.select_related('subcategory__category', 'seller').all()

    def get_permissions(self):
        # Public read, restricted write/actions
        if self.action in ["list", "retrieve", "featured"]:
            return [permissions.AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['list', 'featured']:
            return ProductListSerializer
        return ProductSerializer

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        # Only owner can delete and only when self_rejected
        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=status.HTTP_403_FORBIDDEN)
        if product.status != "self_rejected":
            return Response({"detail": "Chỉ được xóa khi sản phẩm ở trạng thái tự từ chối"}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Product.objects.select_related('subcategory__category', 'seller').all()
        user = self.request.user
        role = getattr(user, 'role', None)  # Nếu không có role, None

        # ----- Phân quyền role -----
        if role == 'seller':
            try:
                seller = user.seller
                queryset = queryset.filter(Q(status='approved') | Q(seller=seller))
            except AttributeError:
                queryset = queryset.filter(status='approved')
        elif role == 'customer' or role is None:
            queryset = queryset.filter(status='approved', is_hidden=False)
        # admin hoặc các role khác thấy tất cả

        # ----- Filter theo query params -----
        params = self.request.query_params
        if 'category' in params:
            category_value = params['category']
            queryset = queryset.filter(
                Q(subcategory__category__key=category_value) |
                Q(category__key=category_value)  # 👈 thêm dòng này
            )

        if 'subcategory' in params:
            queryset = queryset.filter(subcategory__name=params['subcategory'])
        if 'seller' in params:
            queryset = queryset.filter(seller_id=params['seller'])
        if 'seller_name' in params:
            queryset = queryset.filter(seller__user__username__icontains=params['seller_name'])
        if 'search' in params:
            s = params['search']
            queryset = queryset.filter(
                Q(name__icontains=s) |
                Q(description__icontains=s) |
                Q(brand__icontains=s) |
                Q(seller__user__username__icontains=s)
            )

        queryset = queryset.order_by(params.get('ordering', '-created_at'))
        return queryset




    # ----- Admin actions -----
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        product = self.get_object()
        product.status = "approved"
        product.save()
        return Response({"message": "Product approved"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        product = self.get_object()
        product.status = "rejected"
        product.save()
        return Response({"message": "Product rejected"}, status=status.HTTP_200_OK)

    # Seller tự từ chối (để có thể xóa)
    @action(detail=True, methods=["post"], url_path="self-reject", permission_classes=[IsAuthenticated])
    def self_reject(self, request, pk=None):
        product = self.get_object()
        # Chỉ chủ sở hữu mới được tự từ chối
        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=status.HTTP_403_FORBIDDEN)
        product.status = "self_rejected"
        product.save(update_fields=["status"])
        return Response({"message": "Product self rejected"}, status=status.HTTP_200_OK)

    # Ẩn/hiện sản phẩm (chỉ với sản phẩm đã duyệt)
    @action(detail=True, methods=["post"], url_path="toggle-hide", permission_classes=[IsAuthenticated])
    def toggle_hide(self, request, pk=None):
        product = self.get_object()
        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=status.HTTP_403_FORBIDDEN)
        if product.status != "approved":
            return Response({"detail": "Chỉ ẩn/hiện được sản phẩm đã duyệt"}, status=status.HTTP_400_BAD_REQUEST)
        product.is_hidden = not product.is_hidden
        product.save(update_fields=["is_hidden"])
        return Response({"hidden": product.is_hidden})

    @action(detail=True, methods=["post"])
    def ban(self, request, pk=None):
        product = self.get_object()
        product.status = "banned"
        product.save()
        return Response({"message": "Product banned"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unban(self, request, pk=None):
        product = self.get_object()
        if product.status != "banned":
            return Response({"message": "Not banned"}, status=status.HTTP_400_BAD_REQUEST)
        # Only owner or admin can unban
        if not (request.user.is_staff or (hasattr(request.user, "seller") and product.seller == request.user.seller)):
            return Response({"detail": "Không có quyền"}, status=status.HTTP_403_FORBIDDEN)
        product.status = "approved"
        product.save()
        return Response({"message": "Product unbanned"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        product_ids = request.data.get("product_ids", [])
        products = Product.objects.filter(id__in=product_ids, status='pending')
        count = products.update(status='approved')
        return Response({"approved_count": count})

    @action(detail=False, methods=['get'])
    def featured(self, request):
        # Return latest approved and visible products as "featured"
        products = self.get_queryset().filter(status='approved', is_hidden=False).order_by('-created_at')[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def preorder(self, request, pk=None):
        product = self.get_object()
        quantity = int(request.data.get('quantity', 0))

        if product.availability_status != "coming_soon":
            return Response({"detail": "Sản phẩm này không thể đặt trước."}, status=400)

        if quantity <= 0:
            return Response({"detail": "Số lượng đặt không hợp lệ."}, status=400)

        # kiểm tra giới hạn
        if product.estimated_quantity is not None:
            remaining = product.estimated_quantity - product.preordered_quantity
            if quantity > remaining:
                return Response({"detail": f"Chỉ còn {remaining} sản phẩm có thể đặt trước."}, status=400)

        # Tạo một bản Preorder thay vì cố gắng gán vào property read-only
        try:
            Preorder.objects.create(user=request.user, product=product, quantity=quantity)
        except Exception as e:
            return Response({"detail": f"Không thể lưu đặt trước: {str(e)}"}, status=500)

        # Lấy lại tổng số lượng đã đặt trước từ aggregate property
        total_preordered = product.preordered_quantity

        return Response({
            "message": f"Đặt trước thành công {quantity} sản phẩm.",
            "preordered_quantity": total_preordered,
            "remaining": (
                product.estimated_quantity - total_preordered
                if product.estimated_quantity is not None
                else None
            ),
        }, status=200)



# ---------------- CategoryViewSet ----------------
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateSerializer
        return CategorySerializer

    @action(detail=True, methods=['get'], url_path='subcategories')
    def get_subcategories(self, request, pk=None):
        category = self.get_object()
        serializer = SubcategorySerializer(category.subcategories.all(), many=True)
        return Response(serializer.data)
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        category = self.get_object()
        user = request.user
        role = getattr(user, 'role', None)

        products = Product.objects.filter(subcategory__category=category)

        if role == 'seller':
            try:
                seller = user.seller
                products = products.filter(Q(status='approved') | Q(seller=seller))
            except AttributeError:
                products = products.filter(status='approved')
        elif role == 'customer' or role is None:
            products = products.filter(status='approved')
        # admin thấy tất cả

        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def grouped_products(self, request, pk=None):
        category = self.get_object()
        subcategories = category.subcategories.all()
        user = request.user
        role = getattr(user, 'role', None)

        products = Product.objects.filter(subcategory__category=category)

        if role == 'seller':
            try:
                seller = user.seller
                products = products.filter(Q(status='approved') | Q(seller=seller))
            except AttributeError:
                products = products.filter(status='approved')
        elif role == 'customer' or role is None:
            products = products.filter(status='approved')
        # admin thấy tất cả

        grouped = {}
        for sub in subcategories:
            sub_products = products.filter(subcategory=sub)
            grouped[sub.name] = ProductListSerializer(sub_products, many=True, context={'request': request}).data

        sub_serializer = SubcategorySerializer(subcategories, many=True)
        return Response({
            "subcategories": sub_serializer.data,
            "products_by_subcategory": grouped
        })


class SearchAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response({'products': [], 'sellers': [   ]})

        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query)
        ).distinct()[:20]

        sellers = Seller.objects.filter(
            Q(store_name__icontains=query) 
        ).distinct()[:10]

        return Response({
            'products': ProductListSerializer(products, many=True, context={'request': request}).data,
            'sellers': SellerSerializer(sellers, many=True).data
        })
    
class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return Review.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs["product_id"])



# Top-Products

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_products(request):
    filter_type = request.GET.get("filter", "today")

    today = now().date()
    if filter_type == "today":
        start_date = today
    elif filter_type == "week":
        start_date = today - timedelta(days=7)
    elif filter_type == "month":
        start_date = today.replace(day=1)
    else:
        start_date = today

    order_items = (
        OrderItem.objects.filter(order__created_at__date__gte=start_date)
        .values(
            "product",
            "product__name",
            "product__seller__store_name",   # lấy tên shop
            "product__image"
        )
        .annotate(quantity_sold=Sum("quantity"), revenue=Sum("price"))
        .order_by("-quantity_sold")[:10]
    )

    data = []
    for item in order_items:
        data.append({
            "product_id": item["product"],
            "product_name": item["product__name"],
            "shop_name": item["product__seller__store_name"],  # ✅ tên shop
            "quantity_sold": item["quantity_sold"],
            "revenue": item["revenue"],
            "thumbnail": request.build_absolute_uri(item["product__image"]) if item["product__image"] else None,  # ✅ ảnh đầy đủ URL
        })

    return Response(data)



class PreorderCreateView(generics.CreateAPIView):
    """
    API để tạo đơn đặt trước sản phẩm
    """
    def post(self, request, *args, **kwargs):
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        if not product_id:
            return Response({"error": "Thiếu product_id"}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra sản phẩm có tồn tại không
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Sản phẩm không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

        # Tạo đơn đặt trước (giả sử bạn có model Preorder)
        preorder = Preorder.objects.create(
            product=product,
            quantity=quantity,
            customer=request.user if request.user.is_authenticated else None,
        )

        return Response({"message": "Đặt trước thành công", "preorder_id": preorder.id}, status=status.HTTP_201_CREATED)