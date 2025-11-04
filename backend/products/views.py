from django.db.models import Q, Sum, Count
from django.utils.timezone import now, timedelta
from django.core.cache import cache
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView


from .models import Product, Category, Subcategory
from .serializers import (
    ProductSerializer,
    ProductListSerializer,
    CategorySerializer,
    SubcategorySerializer,
    CategoryCreateSerializer,
)
from sellers.models import Seller
from reviews.models import Review
from reviews.serializers import ReviewSerializer
from orders.models import OrderItem, Preorder

import unicodedata

    

@api_view(['GET'])
@permission_classes([AllowAny]) 
def products_by_subcategory(request, subcategory_id):
    products = Product.objects.filter(subcategory_id=subcategory_id, status='approved')
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)

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

    @action(detail=False, methods=["get"], url_path="by-category/(?P<category_id>[^/.]+)")
    def by_category(self, request, category_id=None):
        """Trả về danh mục con thuộc 1 danh mục cha"""
        subcategories = self.queryset.filter(category_id=category_id)
        serializer = self.get_serializer(subcategories, many=True)
        return Response(serializer.data)

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Product.objects.select_related('subcategory__category', 'seller').prefetch_related('images').all()

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
        queryset = Product.objects.select_related('subcategory__category', 'seller').prefetch_related('images').all()
        user = self.request.user
        role = getattr(user, 'role', None)

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
        quantity = int(request.data.get('quantity', 1))

        # ✅ Chỉ cho phép đặt nếu là sản phẩm sắp có
        if product.availability_status != "coming_soon":
            return Response({"detail": "Sản phẩm này không thể đặt trước."}, status=400)

        if quantity <= 0:
            return Response({"detail": "Số lượng đặt không hợp lệ."}, status=400)

        # ✅ Làm mới dữ liệu để đảm bảo chính xác
        product.refresh_from_db()

        # ✅ Kiểm tra giới hạn đặt trước
        current_preordered = product.ordered_quantity or 0
        estimated = product.estimated_quantity or 0

        remaining = estimated - current_preordered

        if remaining <= 0:
            return Response({"detail": "Sản phẩm đã đạt giới hạn đặt trước."}, status=400)

        if quantity > remaining:
            return Response({"detail": f"Chỉ còn {remaining} sản phẩm có thể đặt trước."}, status=400)

        # ✅ Cập nhật số lượng đặt
        product.ordered_quantity = current_preordered + quantity
        product.save(update_fields=["ordered_quantity"])

        return Response({
            "message": f"Đặt trước thành công {quantity} sản phẩm.",
            "ordered_quantity": product.ordered_quantity,
            "remaining": estimated - product.ordered_quantity
        }, status=200)
    
    @property
    def can_preorder(self):
        if self.availability_status != "coming_soon":
            return False
        if self.estimated_quantity is None:
            return False
        return self.ordered_quantity < self.estimated_quantity








# ---------------- CategoryViewSet ----------------
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

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

def normalize_text(text):
    if not text:
        return ''
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    return text.lower().strip()

class SearchAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_image_url(self, obj, field_name, request):
        field = getattr(obj, field_name, None)
        if field and hasattr(field, 'url'):
            return request.build_absolute_uri(field.url)
        return None

    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response({'products': [], 'sellers': [], 'categories': []})

        cache_key = f'search:{query.lower()[:50]}'
        cached_result = cache.get(cache_key)
        if cached_result:
            return Response(cached_result)

        norm_query = normalize_text(query)

        products_qs = Product.objects.filter(
            Q(normalized_name__icontains=norm_query) | Q(description__icontains=query)
)

        # Lọc không dấu trong Python
        products = [
            p for p in products_qs
            if norm_query in normalize_text(p.name) or norm_query in normalize_text(p.description or "")
        ]

        categories = Category.objects.filter(
            Q(name__icontains=query) | Q(name__icontains=norm_query)
        ).annotate(product_count=Count('subcategories__products')).order_by('-product_count')[:5]

        sellers = Seller.objects.filter(
            Q(store_name__icontains=query) | Q(store_name__icontains=norm_query)
        ).annotate(product_count=Count('products')).order_by('-product_count')[:10]

        result = {
            'products': [{
                'id': p.id,
                'name': p.name,
                'description': p.description[:100] if p.description else None,
                'image': self.get_image_url(p, 'image', request),
                'category_name': p.subcategory.category.name if p.subcategory and p.subcategory.category else None,
            } for p in products],
            'categories': [{
                'id': c.id,
                'name': c.name,
                'product_count': c.product_count,
                'image': self.get_image_url(c, 'image', request),
            } for c in categories],
            'sellers': [{
                'id': s.id,
                'name': s.store_name,
                'shop_name': s.store_name,
                'product_count': s.product_count,
                'avatar': self.get_image_url(s, 'avatar', request),
            } for s in sellers]
        }

        cache.set(cache_key, result, 300)
        return Response(result)
    
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
@permission_classes([AllowAny])
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


@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Chỉ user đã đăng nhập mới được gọi
def my_products_simple_list(request):
    # Kiểm tra xem user có phải là seller không
    if not hasattr(request.user, 'seller'):
        return Response({"detail": "User is not a seller."}, status=403)
    
    seller = request.user.seller
    # Lấy các sản phẩm của seller đó và chỉ chọn 2 trường id và name
    products = Product.objects.filter(seller=seller).values('id', 'name')
    
    return Response(list(products))


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
        if product.ordered_quantity + quantity > product.estimated_quantity:
                return Response(
                    {"error": "Vượt quá số lượng đặt trước cho phép."},
                    status=status.HTTP_400_BAD_REQUEST
                )

                product.ordered_quantity += quantity
                product.save()

        return Response({"message": "Đặt trước thành công", "preorder_id": preorder.id}, status=status.HTTP_201_CREATED)
    

    @api_view(['POST'])
    @permission_classes([IsAuthenticated])
    def remove_preorder(request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            preorder = PreOrder.objects.get(user=request.user, product_id=product_id)
            preorder.quantity = max(0, preorder.quantity - quantity)
            preorder.save()

            # Giảm luôn tổng số lượng đã đặt trong Product nếu có
            product = preorder.product
            if hasattr(product, "ordered_quantity"):
                product.ordered_quantity = max(0, product.ordered_quantity - quantity)
                product.save()

            return Response({"message": "Đã cập nhật số lượng đặt trước"}, status=200)
        except PreOrder.DoesNotExist:
            return Response({"error": "Không tìm thấy đơn đặt trước"}, status=404)
