from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Product, Category, Subcategory
from .serializers import ProductSerializer, ProductListSerializer, CategorySerializer, SubcategorySerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    @action(detail=True, methods=['get'])
    def subcategories(self, request, pk=None):
        """Lấy danh sách subcategories của một category"""
        category = self.get_object()
        subcategories = category.subcategories.all()
        serializer = SubcategorySerializer(subcategories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Lấy tất cả sản phẩm của một category"""
        category = self.get_object()
        products = Product.objects.filter(subcategory__category=category)

        # Filter parameters
        subcategory = request.query_params.get('subcategory', None)
        if subcategory:
            products = products.filter(subcategory__name=subcategory)

        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def grouped_products(self, request, pk=None):
        """
        Lấy tất cả subcategories và sản phẩm theo từng subcategory
        """
        category = self.get_object()
        subcategories = category.subcategories.all()
        products = Product.objects.filter(subcategory__category=category)

        grouped = {}
        for sub in subcategories:
            sub_products = products.filter(subcategory=sub)
            serializer = ProductListSerializer(sub_products, many=True)
            grouped[sub.name] = serializer.data

        sub_serializer = SubcategorySerializer(subcategories, many=True)
        return Response({
            "subcategories": sub_serializer.data,
            "products_by_subcategory": grouped
        })


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('subcategory__category', 'seller').all()
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def create(self, request, *args, **kwargs):
        
        print("request.FILES:", request.FILES)
        if 'image' in request.FILES:
            print("Image file received:", request.FILES['image'].name)
        """Override create method to handle FormData properly"""
        print("=== CREATE PRODUCT DEBUG ===")
        print("Received data:", request.data)
        print("Received files:", request.FILES)
        print("Files keys:", list(request.FILES.keys()) if request.FILES else "No files")
        
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            print(f"Image file details: name={image_file.name}, size={image_file.size}, content_type={image_file.content_type}")
        else:
            print("No image file in request.FILES")
        
        try:
            # Đảm bảo request có context
            serializer = self.get_serializer(data=request.data, context={'request': request})
            
            if not serializer.is_valid():
                print("Validation errors:", serializer.errors)
                return Response(
                    {'error': 'Validation failed', 'details': serializer.errors}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print("Validated data:", serializer.validated_data)
            print("Image in validated_data:", 'image' in serializer.validated_data)
            if 'image' in serializer.validated_data:
                print(f"Image value: {serializer.validated_data['image']}")
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            # Log sản phẩm đã tạo
            product = serializer.instance
            print(f"Product created: id={product.id}, name={product.name}")
            print(f"Product image field: {product.image}")
            if product.image:
                print(f"Image path: {product.image.path}")
                print(f"Image URL: {product.image.url}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"Error in create method: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Internal server error', 'message': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(subcategory__category__key=category)
        
        # Filter by subcategory
        subcategory = self.request.query_params.get('subcategory', None)
        if subcategory:
            queryset = queryset.filter(subcategory__name=subcategory)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(brand__icontains=search)
            )
        
        # Filter by features
        is_new = self.request.query_params.get('is_new', None)
        if is_new == 'true':
            queryset = queryset.filter(is_new=True)
            
        is_organic = self.request.query_params.get('is_organic', None)
        if is_organic == 'true':
            queryset = queryset.filter(is_organic=True)
            
        is_best_seller = self.request.query_params.get('is_best_seller', None)
        if is_best_seller == 'true':
            queryset = queryset.filter(is_best_seller=True)
        
        # Sort
        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering:
            queryset = queryset.order_by(ordering)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Lấy sản phẩm nổi bật"""
        products = self.get_queryset().filter(
            Q(is_best_seller=True) | Q(is_new=True) | Q(discount__gt=0)
        )[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
