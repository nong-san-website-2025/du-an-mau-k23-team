from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from django.db.models import Q, Sum
from django.core.exceptions import ValidationError as DjangoValidationError
import traceback
from django.db import transaction
from django.db.models import F

from django.utils import timezone
import pandas as pd
from io import BytesIO
from datetime import datetime

import logging

logger = logging.getLogger(__name__)

from .models import Voucher, FlashSale, UserVoucher, VoucherUsage, FlashSaleProduct
from .serializers import (
    VoucherDetailSerializer,
    VoucherSerializer,
    FlashSaleSerializer,
    FlashSaleAdminSerializer,
    SellerVoucherSerializer,
    UserVoucherSerializer,
    VoucherImportSerializer,
)
from .excel_import_service import FlashSaleExcelImportService
from .services import apply_voucher, preview_voucher, mark_voucher_used
from products.models import Product
from sellers.models import Seller


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all()
    serializer_class = VoucherDetailSerializer
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                return Response({"error": "Dữ liệu gửi lên phải là danh sách (Array)."}, status=400)

            serializer = VoucherImportSerializer(data=data, many=True)
            if not serializer.is_valid():
                return Response({"errors": serializer.errors, "message": "Dữ liệu không hợp lệ."}, status=400)

            validated_data = serializer.validated_data
            vouchers_to_create = []
            current_user = request.user if request.user.is_authenticated else None

            with transaction.atomic():
                for item in validated_data:
                    start_at = datetime.datetime.combine(item['start_date'], datetime.time.min)
                    end_at = datetime.datetime.combine(item['end_date'], datetime.time.max)
                    if timezone.is_naive(start_at): start_at = timezone.make_aware(start_at)
                    if timezone.is_naive(end_at): end_at = timezone.make_aware(end_at)

                    # --- Logic Phân loại giá trị ---
                    d_percent = 0
                    d_amount = 0
                    d_freeship = 0
                    max_disc = None # Để None thay vì 0 nếu DB cho phép null

                    # Chuẩn hóa input
                    raw_type = str(item['discount_type']).lower().strip()

                    if raw_type == 'percent':
                        d_percent = item['value']
                        max_disc = 500000 
                    elif raw_type == 'freeship':
                        d_freeship = item['value']
                    else: 
                        d_amount = item['value']

                    # --- [FIX QUAN TRỌNG] Bỏ trường voucher_type vì DB không có ---
                    voucher = Voucher(
                        code=item['code'],
                        title=item['title'],
                        
                        # Chỉ lưu các giá trị tiền/%, không lưu voucher_type text
                        discount_percent=d_percent,
                        discount_amount=d_amount,
                        freeship_amount=d_freeship,
                        max_discount_amount=max_disc,
                        
                        min_order_value=item.get('min_order', 0),
                        start_at=start_at,
                        end_at=end_at,
                        
                        total_quantity=item['quantity'],
                        per_user_quantity=item.get('per_user_quantity', 1),
                        
                        # Mặc định là Claim để user nhận được
                        distribution_type='claim', 
                        
                        scope='system', 
                        active=True,
                        created_by=current_user
                    )
                    vouchers_to_create.append(voucher)
                
                if vouchers_to_create:
                    Voucher.objects.bulk_create(vouchers_to_create)
                else:
                    return Response({"error": "Không có voucher hợp lệ nào để tạo."}, status=400)

            return Response({"success": True, "message": f"Import thành công {len(vouchers_to_create)} voucher!"}, status=201)

        except Exception as e:
            # In lỗi ra terminal để debug
            print("❌ LỖI IMPORT 500:", str(e))
            print(traceback.format_exc())
            return Response({"error": f"Lỗi hệ thống: {str(e)}"}, status=500)


# ============================================================
# 4. API CLAIM VOUCHER
# ============================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def claim_voucher(request):
    code = request.data.get("code")
    user = request.user

    if not code:
        return Response({"error": "Thiếu mã voucher"}, status=400)

    try:
        with transaction.atomic():
            now = timezone.now()  # Thêm dòng này vào
            voucher = Voucher.objects.select_for_update().filter(
                code=code, active=True
            ).order_by('id').first()

            if not voucher:
                return Response({"error": "Voucher không tồn tại"}, status=404)

            if voucher.start_at and now() < voucher.start_at:
                return Response({"error": "Voucher chưa bắt đầu"}, status=400)
            if voucher.end_at and now() > voucher.end_at:
                return Response({"error": "Voucher đã hết hạn"}, status=400)

            if UserVoucher.objects.filter(user=user, voucher=voucher).exists():
                return Response({"error": "Bạn đã sở hữu voucher này rồi"}, status=400)

            # Check số lượng (Hỗ trợ vô cực)
            total_qty = voucher.total_quantity
            used_qty = voucher.used_quantity if hasattr(voucher, 'used_quantity') else 0
            if used_qty == 0 and hasattr(voucher, 'issued_count'):
                 used_qty = voucher.issued_count()

            if total_qty is not None:
                if used_qty >= total_qty:
                    return Response({"error": "Voucher đã hết lượt sử dụng"}, 400)

            uv = UserVoucher.objects.create(
                user=user, 
                voucher=voucher, 
                quantity=voucher.per_user_quantity or 1
            )
            
            if hasattr(voucher, 'used_quantity'):
                Voucher.objects.filter(pk=voucher.pk).update(used_quantity=F('used_quantity') + 1)

    except Exception as e:
        return Response({"error": str(e)}, status=400)

    serializer = UserVoucherSerializer(uv)
    return Response({"success": True, "message": "Nhận voucher thành công!", "user_voucher": serializer.data})


# ============================================================
# 5. API OVERVIEW (FILTER)
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def promotions_overview(request):
    user = request.user
    search = request.query_params.get("search")
    scope = request.query_params.get("scope")
    distribution_type = request.query_params.get("distribution_type")
    active = request.query_params.get("active")
    voucher_type_filter = request.query_params.get("voucherType")

    if user.is_staff:
        vouchers = Voucher.objects.all().order_by('-created_at')
    else:
        seller = getattr(user, 'seller', None) or getattr(user, 'store', None)
        if seller:
            vouchers = Voucher.objects.filter(Q(scope='system') | Q(seller=seller)).order_by('-created_at')
        else:
            vouchers = Voucher.objects.filter(scope='system').order_by('-created_at')

    if search:
        vouchers = vouchers.filter(Q(title__icontains=search) | Q(code__icontains=search))
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VoucherSerializer
        return VoucherDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class FlashSaleAdminViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all()
    serializer_class = FlashSaleAdminSerializer
    permission_classes = [IsAdminUser]


class SellerVoucherViewSet(viewsets.ModelViewSet):
    serializer_class = SellerVoucherSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'seller'):
            return Voucher.objects.filter(seller=user.seller, scope='seller')
        return Voucher.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'seller'):
            serializer.save(seller=user.seller, scope='seller', created_by=user)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def promotions_overview(request):
    total_vouchers = Voucher.objects.count()
    total_flash_sales = FlashSale.objects.count()
    active_vouchers = Voucher.objects.filter(active=True).count()
    active_flash_sales = FlashSale.objects.filter(is_active=True).count()
    
    return Response({
        'total_vouchers': total_vouchers,
        'total_flash_sales': total_flash_sales,
        'active_vouchers': active_vouchers,
        'active_flash_sales': active_flash_sales,
    })


class FlashSaleListView(generics.ListAPIView):
    queryset = FlashSale.objects.filter(is_active=True)
    serializer_class = FlashSaleSerializer
    
    def get_queryset(self):
        now = timezone.now()
        return FlashSale.objects.filter(
            is_active=True,
            start_time__lte=now,
            end_time__gt=now
        ).prefetch_related('flashsale_products__product')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_vouchers(request):
    user_vouchers = UserVoucher.objects.filter(user=request.user).select_related('voucher')
    serializer = UserVoucherSerializer(user_vouchers, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_voucher(request):
    code = request.data.get('code', '').strip().upper()
    
    if not code:
        return Response(
            {'error': 'Mã voucher không được để trống'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        voucher = Voucher.objects.get(code=code, active=True)
    except Voucher.DoesNotExist:
        return Response(
            {'error': 'Mã voucher không tồn tại hoặc đã bị vô hiệu hóa'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    now = timezone.now()
    if voucher.start_at and now < voucher.start_at:
        return Response(
            {'error': 'Voucher chưa đến thời gian sử dụng'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if voucher.end_at and now > voucher.end_at:
        return Response(
            {'error': 'Voucher đã hết hạn'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if voucher.remaining_quantity() is not None and voucher.remaining_quantity() <= 0:
        return Response(
            {'error': 'Voucher đã hết'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user_voucher, created = UserVoucher.objects.get_or_create(
        user=request.user,
        voucher=voucher,
        defaults={'quantity': voucher.per_user_quantity}
    )
    
    if not created:
        user_voucher.quantity += voucher.per_user_quantity
        user_voucher.save()
    
    serializer = UserVoucherSerializer(user_voucher, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_voucher(request):
    code = request.data.get('code', '').strip().upper()
    subtotal = int(request.data.get('subtotal', 0))
    shipping_fee = int(request.data.get('shipping_fee', 0))
    
    if not code or subtotal <= 0:
        return Response(
            {'error': 'Dữ liệu không hợp lệ'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        result = preview_voucher(request.user, code, subtotal, shipping_fee)
        return Response(result)
    except DjangoValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def consume_voucher(request):
    code = request.data.get('code', '').strip().upper()
    order_id = request.data.get('order_id')
    
    if not code or not order_id:
        return Response(
            {'error': 'Dữ liệu không hợp lệ'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_voucher = UserVoucher.objects.select_related('voucher').get(
            user=request.user,
            voucher__code=code,
            is_used=False
        )
    except UserVoucher.DoesNotExist:
        return Response(
            {'error': 'Voucher không tồn tại hoặc đã dùng'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user_voucher.mark_used_once()
    
    return Response({
        'message': 'Voucher đã được sử dụng',
        'remaining': user_voucher.remaining_for_user()
    })


@api_view(['GET'])
def public_seller_vouchers(request, seller_id):
    try:
        seller = Seller.objects.get(id=seller_id)
    except Seller.DoesNotExist:
        return Response(
            {'error': 'Cửa hàng không tồn tại'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    now = timezone.now()
    vouchers = Voucher.objects.filter(
        seller=seller,
        scope='seller',
        active=True,
        start_at__lte=now,
        end_at__gt=now
    )
    
    serializer = VoucherDetailSerializer(vouchers, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def import_flash_sale_excel(request):
    if 'file' not in request.FILES:
        return Response(
            {'error': 'File không được tìm thấy'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    service = FlashSaleExcelImportService()
    success = service.import_flash_sales(file)
    result = service.get_result()
    
    if success:
        return Response(result, status=status.HTTP_201_CREATED)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def download_flash_sale_template(request):
    df = pd.DataFrame({
        'product_id': [1, 2, 3],
        'flash_price': [50000, 75000, 100000],
        'stock': [50, 75, 100],
        'start_time': [
            '2024-01-15 10:00:00',
            '2024-01-15 10:00:00',
            '2024-01-16 14:00:00'
        ],
        'end_time': [
            '2024-01-15 12:00:00',
            '2024-01-15 12:00:00',
            '2024-01-16 16:00:00'
        ]
    })
    
    excel_file = BytesIO()
    df.to_excel(excel_file, index=False, engine='openpyxl')
    excel_file.seek(0)
    
    response = HttpResponse(
        excel_file.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="flash_sale_template.xlsx"'
    return response


class ImportVoucherAPIView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'File không được tìm thấy'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        
        try:
            df = pd.read_excel(file)
            df.columns = df.columns.str.lower().str.strip()
        except Exception as e:
            return Response(
                {'error': f'Lỗi đọc file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imported_vouchers = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                serializer = VoucherImportSerializer(data={
                    'code': row.get('code'),
                    'title': row.get('title'),
                    'discount_type': row.get('discount_type', 'amount'),
                    'value': row.get('value'),
                    'start_date': row.get('start_date'),
                    'end_date': row.get('end_date'),
                    'quantity': row.get('quantity', 100),
                    'min_order': row.get('min_order', 0),
                })
                
                if not serializer.is_valid():
                    errors.append(f"Dòng {idx + 1}: {serializer.errors}")
                    continue
                
                data = serializer.validated_data
                discount_type = data['discount_type']
                value = data['value']
                
                voucher_data = {
                    'code': data['code'],
                    'title': data['title'],
                    'scope': 'system',
                    'distribution_type': 'claim',
                    'total_quantity': data['quantity'],
                    'per_user_quantity': 1,
                    'start_at': timezone.make_aware(datetime.combine(data['start_date'], datetime.min.time())),
                    'end_at': timezone.make_aware(datetime.combine(data['end_date'], datetime.max.time())),
                    'active': True,
                    'created_by': request.user,
                    'min_order_value': int(data.get('min_order', 0)),
                }
                
                if discount_type == 'amount':
                    voucher_data['discount_amount'] = int(value)
                elif discount_type == 'percent':
                    voucher_data['discount_percent'] = float(value)
                    voucher_data['max_discount_amount'] = int(value * 10)
                elif discount_type == 'freeship':
                    voucher_data['freeship_amount'] = int(value)
                
                voucher = Voucher.objects.create(**voucher_data)
                imported_vouchers.append(voucher)
            
            except Exception as e:
                errors.append(f"Dòng {idx + 1}: {str(e)}")
        
        return Response({
            'success': len(errors) == 0,
            'imported_count': len(imported_vouchers),
            'errors': errors,
            'message': f"Import thành công {len(imported_vouchers)} voucher" if not errors else "Import với lỗi"
        }, status=status.HTTP_201_CREATED if not errors else status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def voucher_usage_history(request):
    user_id = request.query_params.get('user_id')
    search = request.query_params.get('search', '').strip()
    start_date = request.query_params.get('startDate')
    end_date = request.query_params.get('endDate')
    
    # Chỉ Admin mới có thể xem lịch sử tất cả người dùng
    if not request.user.is_staff:
        # User bình thường chỉ xem được lịch sử của chính mình
        if user_id and int(user_id) != request.user.id:
            return Response(
                {'error': 'Bạn không có quyền xem lịch sử này'},
                status=status.HTTP_403_FORBIDDEN
            )
        user_id = request.user.id
        history = VoucherUsage.objects.filter(user_id=user_id).select_related('user', 'voucher', 'order')
    else:
        # Admin xem tất cả
        history = VoucherUsage.objects.all().select_related('user', 'voucher', 'order')
        
        # Nếu user_id được chỉ định, lọc theo user
        if user_id:
            history = history.filter(user_id=user_id)
    
    # Lọc theo tìm kiếm (user name, voucher code, order id)
    if search:
        history = history.filter(
            Q(user__username__icontains=search) |
            Q(user__email__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) |
            Q(voucher__code__icontains=search) |
            Q(order__id__icontains=search)
        )
    
    # Lọc theo khoảng thời gian
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            history = history.filter(used_at__gte=start_dt)
        except Exception as e:
            logger.warning(f"Lỗi parse start_date: {e}")
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            history = history.filter(used_at__lte=end_dt)
        except Exception as e:
            logger.warning(f"Lỗi parse end_date: {e}")
            pass
    
    # Sắp xếp theo ngày gần nhất trước
    history = history.order_by('-used_at')
    
    data = []
    for usage in history:
        data.append({
            'id': usage.id,
            'user_id': usage.user.id,
            'user_name': usage.user.get_full_name() or usage.user.username,
            'user_email': usage.user.email,
            'voucher_code': usage.voucher.code,
            'voucher_title': usage.voucher.title,
            'discount_amount': usage.discount_amount,
            'used_at': usage.used_at,
            'order_id': usage.order.id if usage.order else None,
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def voucher_usage_by_voucher(request, voucher_id):
    try:
        voucher = Voucher.objects.get(id=voucher_id)
    except Voucher.DoesNotExist:
        return Response(
            {'error': 'Voucher không tồn tại'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    history = VoucherUsage.objects.filter(voucher=voucher).select_related('user', 'order')
    
    data = []
    for usage in history:
        data.append({
            'id': usage.id,
            'user_id': usage.user.id,
            'user_name': usage.user.get_full_name() or usage.user.username,
            'user_email': usage.user.email,
            'discount_amount': usage.discount_amount,
            'used_at': usage.used_at,
            'order_id': usage.order.id if usage.order else None,
        })
    
    return Response({
        'voucher_id': voucher.id,
        'voucher_code': voucher.code,
        'voucher_title': voucher.title,
        'total_users': len(set([u['user_id'] for u in data])),
        'usage_count': len(data),
        'history': data
    })
