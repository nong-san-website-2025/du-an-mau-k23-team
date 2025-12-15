import unicodedata
from django.db import transaction
from django.db.models import Q, Sum, Count
from django.utils.timezone import now, timedelta
from django.core.cache import cache
from django.contrib.auth import get_user_model

from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser

# Models
from .models import Product, Category, Subcategory, PendingProductUpdate, ProductImage, ProductView
from sellers.models import Seller, SellerActivityLog
from reviews.models import Review
from orders.models import OrderItem, Preorder
from django.conf import settings

import logging
logger = logging.getLogger(__name__)

# Serializers
from .serializers import (
    ProductSerializer,
    ProductListSerializer,
    CategorySerializer,
    SubcategorySerializer,
    CategoryCreateSerializer,
    ProductImageCreateSerializer
)
from reviews.serializers import ReviewSerializer
import pandas as pd 
from .search_service import search_service

User = get_user_model()

# ================= HELPER FUNCTIONS =================
def normalize_text(text):
    if not text:
        return ''
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    return text.lower().strip()

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def record_product_view(request, product):
    try:
        ip_address = get_client_ip(request)
        user = request.user if request.user.is_authenticated else None
        
        ProductView.objects.create(
            product=product,
            user=user,
            ip_address=ip_address
        )
        
        product.view_count = product.view_count + 1
        product.save(update_fields=['view_count'])
    except Exception as e:
        pass

# ================= FUNCTION BASED VIEWS =================

@api_view(['GET'])
@permission_classes([AllowAny])
def products_by_subcategory(request, subcategory_id):
    products = Product.objects.filter(subcategory_id=subcategory_id, status='approved')
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def products_by_seller(request, seller_id):
    if not request.user.is_staff:  # Chỉ admin mới xem được kiểu này qua ID
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

@api_view(["GET"])
def new_products(request):
    """Lấy 8 sản phẩm mới nhất (Check cả parent status)"""
    products = Product.objects.filter(
        status='approved',
        is_hidden=False,
        subcategory__status='active',
        subcategory__category__status='active'
    ).order_by('-created_at')[:8]
    
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(["GET"])
def best_sellers(request):
    """Lấy 8 sản phẩm bán chạy nhất"""
    products = Product.objects.filter(
        status='approved',
        is_hidden=False,
        subcategory__status='active',
        subcategory__category__status='active'
    ).order_by('-sold')[:8]
    
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

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
            "product__seller__store_name",   
            "product__image"
        )
        .annotate(quantity_sold=Sum("quantity"), revenue=Sum("price"))
        .order_by("-quantity_sold")[:10]
    )

    data = []
    for item in order_items:
        # Xử lý URL ảnh thủ công vì values() chỉ trả về string path
        image_url = None
        if item["product__image"]:
            image_url = request.build_absolute_uri(settings.MEDIA_URL + item["product__image"]) if not item["product__image"].startswith('http') else item["product__image"]
            # Lưu ý: Cần import settings nếu dùng MEDIA_URL, hoặc để request.build_absolute_uri tự lo nếu path tương đối

        data.append({
            "product_id": item["product"],
            "product_name": item["product__name"],
            "shop_name": item["product__seller__store_name"],
            "quantity_sold": item["quantity_sold"],
            "revenue": item["revenue"],
            "thumbnail": request.build_absolute_uri(item["product__image"]) if item["product__image"] else None,
        })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_products_simple_list(request):
    if not hasattr(request.user, 'seller'):
        return Response({"detail": "User is not a seller."}, status=403)
    
    seller = request.user.seller
    products = Product.objects.filter(seller=seller).values('id', 'name')

    return Response(list(products))

class ImportProductExcelView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        if not hasattr(request.user, 'seller'):
            return Response({"error": "Bạn không phải là người bán hàng"}, status=status.HTTP_403_FORBIDDEN)
        
        seller = request.user.seller
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({"error": "Vui lòng chọn file Excel"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj, engine='openpyxl')

            # 1. BẢNG DỊCH (MAPPING) TIẾNG VIỆT -> BIẾN DB
            column_mapping = {
                'tên sản phẩm': 'name',
                'giá gốc': 'original_price',
                'giá khuyến mãi': 'discounted_price',
                'tồn kho': 'stock',
                'danh mục': 'category',
                'nhóm hàng': 'subcategory',
                'mô tả': 'description',
                'xuất xứ': 'location',      # Chấp nhận 'xuất xứ'
                'đơn vị': 'unit',
            }

            # 2. Chuẩn hóa tên cột
            df.columns = df.columns.str.strip().str.lower()

            # 3. Đổi tên cột
            df.rename(columns=column_mapping, inplace=True)

            # 4. Kiểm tra cột bắt buộc
            required_cols = ['name', 'original_price', 'category', 'subcategory']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                reverse_map = {v: k for k, v in column_mapping.items()}
                missing_vn = [reverse_map.get(c, c) for c in missing_cols]
                return Response(
                    {"error": f"File thiếu các cột bắt buộc: {', '.join(missing_vn).upper()}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            success_count = 0
            errors = []

            # Mapping đơn vị tính tiếng Việt sang code (kg, g, l...)
            unit_mapping = {
                'cái': 'unit', 'chiếc': 'unit', 'hộp': 'unit', 'bao': 'unit',
                'kg': 'kg', 'kilogram': 'kg', 'kí': 'kg',
                'g': 'g', 'gram': 'g', 'gam': 'g',
                'l': 'l', 'lít': 'l',
                'ml': 'ml'
            }

            # 5. Xử lý dữ liệu
            for index, row in df.iterrows():
                try:
                    with transaction.atomic():
                        # Xử lý Danh mục
                        cat_name = str(row.get('category', '')).strip()
                        sub_name = str(row.get('subcategory', '')).strip()
                        
                        category = Category.objects.filter(name__iexact=cat_name).first()
                        if not category:
                            raise ValueError(f"Không tìm thấy danh mục: {cat_name}")

                        subcategory = Subcategory.objects.filter(name__iexact=sub_name, category=category).first()
                        if not subcategory:
                            raise ValueError(f"Không tìm thấy nhóm hàng '{sub_name}' thuộc '{cat_name}'")

                        # Xử lý Đơn vị tính (thông minh)
                        raw_unit = str(row.get('unit', 'kg')).lower().strip()
                        # Nếu tìm thấy trong mapping thì lấy, không thì mặc định là 'kg'
                        final_unit = unit_mapping.get(raw_unit, 'kg') 

                        # Tạo sản phẩm
                        product = Product(
                            seller=seller,
                            name=row['name'],
                            original_price=row.get('original_price', 0),
                            discounted_price=row.get('discounted_price', row.get('original_price', 0)),
                            stock=row.get('stock', 0),
                            description=row.get('description', ''),
                            
                            # 👇 Gán các trường mới
                            brand=str(row.get('brand', '')).strip(),
                            location=str(row.get('location', '')).strip(),
                            unit=final_unit,

                            category=category,
                            subcategory=subcategory,
                            status='pending',
                            availability_status='available' if row.get('stock', 0) > 0 else 'out_of_stock'
                        )
                        product.save()
                        success_count += 1

                except Exception as e:
                    errors.append(f"Dòng {index + 2}: {str(e)}")

            return Response({
                "message": "Xử lý hoàn tất",
                "total": len(df),
                "success": success_count,
                "errors": errors
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Lỗi xử lý file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================= VIEWSETS & CLASS BASED VIEWS =================

class SubcategoryViewSet(viewsets.ModelViewSet):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=["get"], url_path="by-category/(?P<category_id>[^/.]+)")
    def by_category(self, request, category_id=None):
        subcategories = self.queryset.filter(category_id=category_id)
        serializer = self.get_serializer(subcategories, many=True)
        return Response(serializer.data)

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Product.objects.select_related('subcategory__category', 'seller').prefetch_related('images').all()

    # ✅ ĐÃ SỬA: Thêm "increment_views" vào AllowAny để fix lỗi 401
    def get_permissions(self):
        if self.action in ["list", "retrieve", "featured", "increment_views"]:
            return [permissions.AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['list', 'featured']:
            return ProductListSerializer
        return ProductSerializer

    # ✅ ĐÃ SỬA: Logic Get Queryset
    def get_queryset(self):
        queryset = Product.objects.select_related('subcategory__category', 'seller').prefetch_related('images').all()
        user = self.request.user

        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'toggle_hide', 'set_primary_image']:
            return queryset

        # 1. Nếu là Admin: Thấy tất cả
        if user.is_authenticated and user.is_staff:
            pass
        
        # 2. Nếu là Seller (xem sản phẩm của mình): Thấy tất cả (để quản lý)
        # Lưu ý: Cần kiểm tra filter query param để biết có đang filter theo seller_id của mình không
        elif user.is_authenticated and hasattr(user, 'seller') and str(user.seller.id) == self.request.query_params.get('seller'):
             pass # Cho phép thấy sản phẩm ẩn của chính mình

        # 3. Khách hàng / Public: Chỉ thấy Approved và KHÔNG ẨN
        else:
            queryset = queryset.filter(
                status='approved', 
                is_hidden=False,            # 👈 BẮT BUỘC: Không lấy sản phẩm ẩn
                subcategory__status='active',          
                subcategory__category__status='active' 
            )

        # ----- Filter theo query params -----
        params = self.request.query_params
        if 'category' in params:
            queryset = queryset.filter(Q(subcategory__category__key=params['category']) | Q(subcategory__category__id=params['category']))
        if 'subcategory' in params:
            queryset = queryset.filter(subcategory__name=params['subcategory'])
        if 'seller' in params:
            queryset = queryset.filter(seller_id=params['seller'])
        if 'seller_name' in params:
            queryset = queryset.filter(seller__user__username__icontains=params['seller_name'])
        if 'search' in params:
            s = params['search']
            queryset = queryset.filter(
                Q(name__icontains=s) | Q(description__icontains=s) | Q(brand__icontains=s) | Q(seller__user__username__icontains=s)
            )

        # Admin, seller thấy tất cả - khách hàng chỉ thấy approved & not hidden
        if not (user.is_authenticated and user.is_staff) and not (user.is_authenticated and hasattr(user, 'seller') and str(user.seller.id) == params.get('seller')):
            # Chỉ filter category/subcategory status cho khách hàng
            queryset = queryset.filter(
                subcategory__status='active',
                subcategory__category__status='active',
                status='approved',
                is_hidden=False
            )
        else:
            # Admin và seller thấy tất cả, không filter status
            pass
        
        return queryset.order_by(self.request.query_params.get('ordering', '-created_at'))

    # ✅ ĐÃ SỬA: Logic Retrieve (Chi tiết sản phẩm)
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        
        # 1. Admin hoặc Chủ sở hữu (Seller) -> Được xem kể cả khi ẩn/chưa duyệt
        is_owner = user.is_authenticated and hasattr(user, 'seller') and instance.seller == user.seller
        
        if (user.is_authenticated and user.is_staff) or is_owner:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        
        # 2. Khách hàng -> Chặn nếu chưa duyệt hoặc bị ẩn
        if instance.status != 'approved' or instance.is_hidden:
            return Response(
                {"detail": "Sản phẩm không tồn tại hoặc đã bị khóa."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ❌ ĐÃ TẮT: Không đếm view ở đây nữa để tránh bị đếm trùng lặp
        # record_product_view(request, instance) 
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        product = self.get_object()

        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=403)

        old_status = product.status

        if old_status in ["pending", "pending_update", "rejected", "self_rejected"]:
            return super().update(request, *args, **kwargs)

        if old_status == "approved":
            pending_update, created = PendingProductUpdate.objects.get_or_create(product=product, defaults={})
            serializer = self.get_serializer(product, data=request.data, partial=True)
            if serializer.is_valid():
                for field, value in serializer.validated_data.items():
                    if hasattr(pending_update, field):
                        setattr(pending_update, field, value)
                pending_update.save()

                product.status = "pending_update"
                product.is_hidden = True # Tự động ẩn khi có update chờ duyệt
                product.save(update_fields=["status", "is_hidden"])

                return Response({"message": "Đã gửi yêu cầu cập nhật.", "status": "pending_update"}, status=200)
            else:
                return Response(serializer.errors, status=400)

        return Response({"detail": "Sản phẩm bị khóa, không thể chỉnh sửa"}, status=403)

    # ----- ACTIONS -----

    @action(detail=True, methods=['post'], url_path='increment-views', permission_classes=[AllowAny])
    def increment_views(self, request, pk=None):
        """
        API chuyên dụng để tăng view.
        Frontend sẽ kiểm soát việc gọi API này (chỉ gọi 1 lần/phiên).
        """
        try:
            product = self.get_object()
            
            # Gọi hàm helper record_product_view đã có sẵn ở trên
            record_product_view(request, product)
            
            return Response({
                "status": "success", 
                "view_count": product.view_count
            }, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=True, methods=['post'], url_path='set-primary-image', permission_classes=[IsAuthenticated])
    def set_primary_image(self, request, pk=None):
        product = self.get_object()
        image_id = request.data.get("image_id")

        if not image_id: return Response({"error": "Thiếu image_id"}, status=400)
        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=403)

        try:
            target_image = ProductImage.objects.get(id=image_id, product=product)
        except ProductImage.DoesNotExist:
            return Response({"error": "Ảnh không tồn tại"}, status=404)

        with transaction.atomic():
            product.images.all().update(is_primary=False)
            target_image.is_primary = True
            target_image.save()
            product.image = target_image.image
            product.save(update_fields=['image'])

        return Response({"message": "Đã đặt làm ảnh đại diện thành công"}, status=200)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve_update(self, request, pk=None):
        product = self.get_object()
        if product.status != "pending_update": return Response({"detail": "Lỗi trạng thái"}, status=400)
        try:
            product.pending_update.apply_changes()
            return Response({"message": "Đã duyệt cập nhật"})
        except PendingProductUpdate.DoesNotExist:
            return Response({"detail": "Không tìm thấy dữ liệu cập nhật"}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject_update(self, request, pk=None):
        product = self.get_object()
        if product.status != "pending_update": return Response({"detail": "Lỗi trạng thái"}, status=400)
        try:
            product.pending_update.delete()
            product.status = "approved"
            product.is_hidden = False
            product.save(update_fields=["status", "is_hidden"])
            return Response({"message": "Đã từ chối cập nhật"})
        except PendingProductUpdate.DoesNotExist:
            return Response({"detail": "Không tìm thấy dữ liệu"}, status=400)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def pending_updates(self, request):
        products = self.get_queryset().filter(status='pending_update').select_related('pending_update')
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        product = self.get_object()
        
        # Kiểm tra nếu là duyệt cập nhật thì gọi sang hàm approve_update
        if product.status == 'pending_update':
            # Tùy logic bên bạn, có thể báo lỗi bảo dùng nút khác 
            # hoặc tự động chuyển hướng xử lý:
            if hasattr(product, 'pending_update'):
                product.pending_update.apply_changes()
                return Response({"message": "Đã duyệt cập nhật thành công"})
        
        # Logic duyệt sản phẩm mới
        product.status = 'approved'
        product.is_hidden = False # Duyệt xong thì hiện luôn
        product.save()
        
        return Response({"message": "Đã duyệt sản phẩm thành công"}, status=200)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser]) 
    def reject(self, request, pk=None):
        product = self.get_object()

        # 🚨 DÒNG DEBUG QUAN TRỌNG: In ra toàn bộ dữ liệu request
        logger.warning(f"Reject request data received: {request.data}") 

        # 1. Lấy lý do từ Admin gửi lên (frontend có thể gửi key là 'reason' hoặc 'reject_reason')
        reason = request.data.get('reject_reason') or request.data.get('reason')

        # 🚨 DÒNG DEBUG QUAN TRỌNG: Kiểm tra giá trị reason sau khi lấy
        logger.warning(f"Extracted reason: {reason}")

        # 2. Cập nhật trạng thái và lý do
        product.status = "rejected"

        if reason:
            product.reject_reason = reason
        else:
            # Nếu chạy vào đây, TÊN KEY BỊ SAI.
            product.reject_reason = "Admin đã từ chối sản phẩm này (Không có lý do cụ thể)."

        # ... (các đoạn code lưu và xử lý khác) ...
        product.save()
        return Response({"message": "Đã từ chối sản phẩm thành công!"}, status=200)



    @action(detail=True, methods=["post"], url_path="request-import", permission_classes=[IsAdminUser])
    def request_import(self, request, pk=None):
        product = self.get_object()
        product.import_request_at = now()
        product.save(update_fields=["import_request_at"])
        return Response({"message": "Đã gửi yêu cầu nhập sản phẩm thành công"}, status=200)

    @action(detail=False, methods=["get"], url_path="with-import-requests", permission_classes=[IsAuthenticated])
    def with_import_requests(self, request):
        seller_id = request.user.seller.id if hasattr(request.user, 'seller') else None
        if not seller_id:
            return Response({"detail": "Chỉ seller mới có quyền xem"}, status=403)
        
        products = Product.objects.filter(
            seller_id=seller_id,
            status='approved',
            import_request_at__isnull=False
        ).order_by('-import_request_at')
        
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="self-reject", permission_classes=[IsAuthenticated])
    def self_reject(self, request, pk=None):
        product = self.get_object()
        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=403)
        product.status = "self_rejected"
        product.save(update_fields=["status"])
        return Response({"message": "Self rejected"}, status=200)

    # ✅ Action Toggle Hide: Cho phép Seller ẩn/hiện sản phẩm Approved
    @action(detail=True, methods=["post"], url_path="toggle-hide", permission_classes=[IsAuthenticated])
    def toggle_hide(self, request, pk=None):
        product = self.get_object()
        
        # Check quyền
        if not hasattr(request.user, "seller") or product.seller != request.user.seller:
            return Response({"detail": "Không có quyền"}, status=403)
        
        # Chỉ cho phép ẩn sản phẩm ĐANG BÁN (Approved)
        if product.status != "approved":
            return Response({"detail": "Chỉ ẩn/hiện được sản phẩm đang bán (Đã duyệt)"}, status=400)
            
        product.is_hidden = not product.is_hidden
        product.save(update_fields=["is_hidden"])
        return Response({"hidden": product.is_hidden, "message": "Đã thay đổi trạng thái hiển thị"})

    @action(detail=True, methods=["post"])
    def ban(self, request, pk=None):
        product = self.get_object()
        product.status = "banned"
        product.save()
        return Response({"message": "Banned"}, status=200)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unban(self, request, pk=None):
        product = self.get_object()
        if product.status != "banned": return Response({"message": "Not banned"}, status=400)
        if not (request.user.is_staff or (hasattr(request.user, "seller") and product.seller == request.user.seller)):
            return Response({"detail": "Không có quyền"}, status=403)
        product.status = "approved"
        product.save()
        return Response({"message": "Unbanned"}, status=200)

    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        product_ids = request.data.get("product_ids", [])
        products = Product.objects.filter(id__in=product_ids, status='pending')
        count = products.update(status='approved')
        return Response({"approved_count": count})

    @action(detail=False, methods=['get'])
    def featured(self, request):
        # Featured dùng get_queryset nên đã tự động lọc is_hidden=False
        products = self.get_queryset().order_by('-created_at')[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @property
    def can_preorder(self):
        return True 

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def preorder(self, request, pk=None):
        product = self.get_object()
        quantity = int(request.data.get('quantity', 1))

        if product.availability_status != "coming_soon":
            return Response({"detail": "Sản phẩm này không thể đặt trước."}, status=400)
        if quantity <= 0:
            return Response({"detail": "Số lượng không hợp lệ."}, status=400)

        product.refresh_from_db()
        current_preordered = product.ordered_quantity or 0
        estimated = product.estimated_quantity or 0
        remaining = estimated - current_preordered

        if remaining <= 0: return Response({"detail": "Đã hết lượt đặt trước."}, status=400)
        if quantity > remaining: return Response({"detail": f"Chỉ còn {remaining} lượt đặt."}, status=400)

        Preorder.objects.create(product=product, quantity=quantity, customer=request.user)
        product.ordered_quantity = current_preordered + quantity
        product.save(update_fields=["ordered_quantity"])

        return Response({
            "message": f"Đặt trước thành công {quantity} sản phẩm.",
            "ordered_quantity": product.ordered_quantity,
            "remaining": estimated - product.ordered_quantity
        }, status=200)

    @action(detail=False, methods=['post'], url_path='remove-preorder', permission_classes=[IsAuthenticated])
    def remove_preorder(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            preorder = Preorder.objects.filter(customer=request.user, product_id=product_id).first()
            if not preorder: return Response({"error": "Không tìm thấy đơn đặt trước"}, status=404)

            new_quantity = max(0, preorder.quantity - quantity)
            product = preorder.product
            if hasattr(product, "ordered_quantity"):
                product.ordered_quantity = max(0, (product.ordered_quantity or 0) - (preorder.quantity - new_quantity))
                product.save()
            
            if new_quantity == 0:
                preorder.delete()
                return Response({"message": "Đã hủy đơn đặt trước"}, status=200)
            else:
                preorder.quantity = new_quantity
                preorder.save()
                return Response({"message": "Đã cập nhật số lượng"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)

# ================= IMAGE UPLOAD VIEWS =================

class ProductImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, seller__user=request.user)
        except Product.DoesNotExist:
            return Response(
                {"error": "Sản phẩm không tồn tại hoặc không thuộc về bạn"},
                status=status.HTTP_403_FORBIDDEN
            )

        files = request.FILES.getlist('images')
        if not files:
            return Response({"error": "Vui lòng chọn ít nhất một ảnh"}, status=status.HTTP_400_BAD_REQUEST)

        if len(files) > 6:
            return Response({"error": "Tối đa 6 ảnh"}, status=status.HTTP_400_BAD_REQUEST)

        is_primary_flags = request.data.getlist('is_primary')
        
        created_images = []
        for i, file in enumerate(files):
            is_primary = False
            if is_primary_flags and i < len(is_primary_flags):
                is_primary = is_primary_flags[i].lower() == 'true'

            img = ProductImage.objects.create(
                product=product,
                image=file,
                is_primary=is_primary
            )
            created_images.append(img)

        return Response(
            {"message": "Tải ảnh thành công", "count": len(created_images)},
            status=status.HTTP_201_CREATED
        )

class ProductImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, image_id):
        try:
            img = ProductImage.objects.get(id=image_id, product__seller__user=request.user)
            img.delete()
            return Response({"message": "Xóa ảnh thành công"}, status=status.HTTP_204_NO_CONTENT)
        except ProductImage.DoesNotExist:
            return Response({"error": "Ảnh không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

# ================= CATEGORY VIEWSET =================

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryCreateSerializer
        return CategorySerializer
    
    def perform_update(self, serializer):
        instance = serializer.save()
        if 'status' in serializer.validated_data:
            instance.subcategories.all().update(status=serializer.validated_data['status'])

    @action(detail=True, methods=['get'], url_path='subcategories')
    def get_subcategories(self, request, pk=None):
        category = self.get_object()
        serializer = SubcategorySerializer(category.subcategories.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        category = self.get_object()
        user = request.user
        
        # ✅ ĐÃ SỬA: Lọc bỏ sản phẩm ẩn
        products = Product.objects.filter(subcategory__category=category)
        if not (user.is_authenticated and user.is_staff):
            products = products.filter(
                status='approved', 
                is_hidden=False, 
                subcategory__status='active',
                subcategory__category__status='active' 
            ).exclude(status='banned')

        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def grouped_products(self, request, pk=None):
        category = self.get_object()
        subcategories = category.subcategories.all()
        user = request.user
        role = getattr(user, 'role', None)

        products = Product.objects.filter(subcategory__category=category)
        if role == 'seller' or role == 'customer' or role is None:
             if not user.is_staff:
                # ✅ ĐÃ SỬA: Lọc bỏ sản phẩm ẩn
                products = products.filter(status='approved', is_hidden=False).exclude(status='banned')

        grouped = {}
        for sub in subcategories:
            sub_products = products.filter(subcategory=sub)
            grouped[sub.name] = ProductListSerializer(sub_products, many=True, context={'request': request}).data

        sub_serializer = SubcategorySerializer(subcategories, many=True)
        return Response({
            "subcategories": sub_serializer.data,
            "products_by_subcategory": grouped
        })

# ================= SEARCH & OTHER VIEWS =================

class FeaturedCategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_featured=True)
    serializer_class = CategorySerializer

class SearchAPIView(APIView):
    permission_classes = [AllowAny]

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
        if cached_result: return Response(cached_result)

        norm_query = normalize_text(query)

        # ✅ ĐÃ SỬA: Đảm bảo search cũng không ra hàng ẩn
        products_qs = Product.objects.filter(
            status="approved",
            is_hidden=False,
            subcategory__status='active',
            subcategory__category__status='active'
        ).filter(
            Q(normalized_name__icontains=norm_query) | Q(description__icontains=query)
        ).select_related('subcategory__category')

        products = [
            p for p in products_qs
            if norm_query in normalize_text(p.name) or norm_query in normalize_text(p.description or "")
        ]

        # Logic search seller/category giữ nguyên
        categories = Category.objects.filter(
            Q(name__icontains=query) | Q(name__icontains=norm_query)
        ).annotate(
            product_count=Count('subcategories__products', filter=Q(subcategories__products__status='approved'))
        ).order_by('-product_count')[:5]

        sellers = Seller.objects.filter(
            Q(store_name__icontains=query) | Q(store_name__icontains=norm_query)
        ).annotate(
            product_count=Count('products', filter=Q(products__status='approved'))
        ).order_by('-product_count')[:10]

        result = {
            'products': [{
                'id': p.id,
                'name': p.name,
                'description': p.description[:100] if p.description else None,
                'image': self.get_image_url(p, 'image', request),
                'category_name': (p.subcategory.category.name if p.subcategory and p.subcategory.category else None),
            } for p in products],
            'categories': [{
                'id': c.id, 'name': c.name, 'product_count': c.product_count,
                'image': self.get_image_url(c, 'image', request),
            } for c in categories],
            'sellers': [{
                'id': s.id, 'name': s.store_name, 'shop_name': s.store_name,
                'product_count': s.product_count, 'avatar': self.get_image_url(s, 'avatar', request),
            } for s in sellers]
        }

        cache.set(cache_key, result, 300)
        return Response(result)

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return Review.objects.filter(product_id=product_id, is_hidden=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs["product_id"])

    
@api_view(['GET'])
@permission_classes([AllowAny])
def smart_search(request):
    query = request.GET.get('q', '').strip()
    
    # Cấu trúc trả về mặc định để Frontend không lỗi
    empty_response = {'products': [], 'shops': [], 'categories': []}

    if not query:
        return Response(empty_response)

    try:
        # Gọi xuống Service Meilisearch
        result = search_service.search(query)
        hits = result.get('hits', [])
        
        response_data = {
            'products': [],
            'shops': [],
            'categories': []
        }

        seen_shops = set()
        seen_cats = set()

        for item in hits:
            # 1. Product list
            response_data['products'].append({
                'id': item['id'],
                'name': item['name'],
                # Lấy tên đã highlight (có thẻ <em>)
                'highlighted_name': item['_formatted']['name'] if '_formatted' in item else item['name'], 
                'price': item['price'],
                'image': item['image'],
                'sold': item['sold']
            })

            # 2. Shop Suggestion
            if item.get('store_name') and item['store_name'] not in seen_shops:
                response_data['shops'].append(item['store_name'])
                seen_shops.add(item['store_name'])

            # 3. Category Suggestion
            if item.get('category_name') and item['category_name'] not in seen_cats:
                response_data['categories'].append({
                    'name': item['category_name'],
                    'slug': item.get('category_slug', '')
                })
                seen_cats.add(item['category_name'])

        return Response(response_data)

    except Exception as e:
        print(f"⚠️ Search Error: {e}")
        # Nếu lỗi (VD: chưa chạy sync), trả về rỗng để web không chết
        return Response(empty_response)