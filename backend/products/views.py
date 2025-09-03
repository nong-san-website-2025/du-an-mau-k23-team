from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Product, Category
from .serializers import ProductSerializer, ProductListSerializer, CategorySerializer, SubcategorySerializer
from rest_framework.views import APIView
from blog.serializers import PostSerializer
from blog.models import Post
from rest_framework import generics, permissions
from reviews.models import Review
from reviews.serializers import ReviewSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Subcategory, Product
from .serializers import CategorySerializer, SubcategorySerializer, ProductListSerializer, CategoryCreateSerializer
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.db.models import Q
from .serializers import ProductSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])  # chỉ admin được gọi
def products_by_seller(request, seller_id):
    products = Product.objects.filter(seller_id=seller_id)
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
    queryset = Product.objects.select_related('subcategory__category', 'seller').all()

    def get_serializer_class(self):
        if self.action in ['list', 'featured']:
            return ProductListSerializer
        return ProductSerializer

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
            queryset = queryset.filter(status='approved')
        # admin hoặc các role khác thấy tất cả

        # ----- Filter theo query params -----
        params = self.request.query_params
        if 'category' in params:
            queryset = queryset.filter(subcategory__category__key=params['category'])
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

    @action(detail=True, methods=["post"])
    def ban(self, request, pk=None):
        product = self.get_object()
        product.status = "banned"
        product.save()
        return Response({"message": "Product banned"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def unban(self, request, pk=None):
        product = self.get_object()
        if product.status != "banned":
            return Response({"message": "Not banned"}, status=status.HTTP_400_BAD_REQUEST)
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
        products = self.get_queryset().filter(
            Q(is_best_seller=True) | Q(is_new=True) | Q(discount__gt=0)
        )[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

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
    def get(self, request):
        query = request.GET.get('q', '')
        products = Product.objects.filter(name__icontains=query)[:5]
        posts = Post.objects.filter(title__icontains=query)[:5]
        return Response({
            'products': ProductSerializer(products, many=True).data,
            'posts': PostSerializer(posts, many=True).data
        })
    
class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return Review.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs["product_id"])