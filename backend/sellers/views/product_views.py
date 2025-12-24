from rest_framework import viewsets, status, permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction

from sellers.models import Seller
from products.models import Product, PendingProductUpdate, ProductImage # Giả định ProductImage nằm ở đây
from products.serializers import ProductSerializer, ProductListSerializer

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Product.objects.all().order_by('-created_at')
        return Product.objects.filter(seller__user=user).order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='set-primary-image')
    def set_primary_image(self, request, pk=None):
        product = self.get_object()
        image_id = request.data.get("image_id")

        if not image_id:
            return Response({"error": "Thiếu image_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_image = ProductImage.objects.get(id=image_id, product=product)
        except ProductImage.DoesNotExist:
            return Response({"error": "Ảnh không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            product.images.all().update(is_primary=False)
            target_image.is_primary = True
            target_image.save()
            product.image = target_image.image
            product.save(update_fields=['image'])

        return Response({"message": "Đã cập nhật ảnh đại diện"}, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        seller = Seller.objects.filter(user=self.request.user).first()
        if not seller:
            raise serializers.ValidationError({"detail": "Bạn chưa đăng ký làm seller"})
        serializer.save(seller=seller)

    def update(self, request, *args, **kwargs):
        product = self.get_object()
        # Logic check quyền
        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=403)

        old_status = product.status
        if old_status in ["pending", "pending_update", "rejected", "self_rejected"]:
            return super().update(request, *args, **kwargs)

        if old_status == "approved":
            pending_update, created = PendingProductUpdate.objects.get_or_create(
                product=product, defaults={}
            )
            serializer = self.get_serializer(product, data=request.data, partial=True)
            if serializer.is_valid():
                for field, value in serializer.validated_data.items():
                    if hasattr(pending_update, field):
                        setattr(pending_update, field, value)
                pending_update.save()

                product.status = "pending_update"
                product.is_hidden = True
                product.save(update_fields=["status", "is_hidden"])

                return Response({
                    "message": "Yêu cầu cập nhật đã được gửi. Sản phẩm sẽ tạm ẩn.",
                    "status": "pending_update"
                }, status=200)
            else:
                return Response(serializer.errors, status=400)

        return Response({"detail": "Sản phẩm bị khóa, không thể chỉnh sửa"}, status=403)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.seller.user != request.user: # Sửa lại logic check owner
             return Response({"detail": "Không có quyền xóa"}, status=403)
        self.perform_destroy(instance)
        return Response(status=204)

class SellerProductsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if getattr(request.user.role, "name", "") != "seller":
            return Response({"detail": "Bạn chưa được duyệt làm seller"}, status=403)

        seller = Seller.objects.get(user=request.user) # Giả sử đã có seller
        
        search = request.GET.get("search", "")
        status_filter = request.GET.get("status", "") 

        products = Product.objects.filter(seller=seller)
        if search:
            products = products.filter(name__icontains=search)
        if status_filter:
            products = products.filter(status=status_filter)

        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

class SellerImportRequestProductsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if getattr(request.user.role, "name", "") != "seller":
            return Response({"detail": "Bạn chưa được duyệt làm seller"}, status=403)

        seller = Seller.objects.get(user=request.user)
        products = Product.objects.filter(
            seller=seller,
            status='approved',
            import_request_at__isnull=False
        ).order_by('-import_request_at')

        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def seller_products_list(request, seller_id):
    """Admin xem danh sách SP của Seller"""
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)
    products = Product.objects.filter(seller=seller).order_by('-created_at')
    serializer = ProductListSerializer(products, many=True)
    return Response({
        'seller_id': seller.id,
        'store_name': seller.store_name,
        'results': serializer.data,
        'count': products.count()
    })