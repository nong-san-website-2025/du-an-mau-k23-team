from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Avg, F, FloatField, Count
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import date, timedelta
from django.shortcuts import get_object_or_404

# Models
from sellers.models import Seller, SellerActivityLog, Shop
from products.models import Product
from orders.models import Order, OrderItem
from users.models import Role 

# Serializers
from sellers.serializers import SellerListSerializer, SellerActivityLogSerializer
from products.serializers import ProductListSerializer

# --- CÁC API ADMIN CƠ BẢN ---

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def pending_sellers_count(request):
    count = Seller.objects.filter(status='pending').count()
    return Response({"count": count})

class SellerRejectAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response(
                {"detail": "Seller not found or already processed."},
                status=status.HTTP_404_NOT_FOUND,
            )
        seller.status = "rejected"
        reason = request.data.get("reason", "")
        if reason:
            seller.rejection_reason = reason
        seller.save()
        return Response({"detail": "Seller rejected."}, status=status.HTTP_200_OK)

class SellerApproveAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response(
                {"detail": "Seller not found or already approved."},
                status=status.HTTP_404_NOT_FOUND,
            )

        seller.status = "approved"
        seller.save()

        # Đổi role user sang "seller"
        seller_role, created = Role.objects.get_or_create(name="seller")
        user = seller.user
        user.role = seller_role
        user.save(update_fields=["role"])

        Shop.objects.get_or_create(owner=user, defaults={"name": seller.store_name})

        return Response(
            {"detail": "Seller approved & user role updated."},
            status=status.HTTP_200_OK,
        )

# API cũ (giữ lại để tránh lỗi nếu còn chỗ dùng)
class SellerLockAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        seller = get_object_or_404(Seller, pk=pk)
        if seller.status == "active":
            seller.status = "locked"
        elif seller.status == "locked":
            seller.status = "active"
        seller.save()
        return Response({"status": seller.status})

# [MỚI] API Khóa/Mở khóa 1 cửa hàng (Dùng cho nút Toggle)
class SellerToggleLockAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        seller = get_object_or_404(Seller, pk=pk)
        if seller.status == "active":
            seller.status = "locked"
        elif seller.status == "locked":
            seller.status = "active"
        seller.save()
        return Response({"status": seller.status, "message": "Cập nhật trạng thái thành công"})

# [MỚI] API Khóa hàng loạt
class SellerBulkLockAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"detail": "Danh sách ID trống"}, status=status.HTTP_400_BAD_REQUEST)
        updated_count = Seller.objects.filter(id__in=ids, status="active").update(status="locked")
        return Response({"message": f"Đã khóa {updated_count} cửa hàng thành công"})

# [MỚI] API Mở khóa hàng loạt
class SellerBulkUnlockAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"detail": "Danh sách ID trống"}, status=status.HTTP_400_BAD_REQUEST)
        updated_count = Seller.objects.filter(id__in=ids, status="locked").update(status="active")
        return Response({"message": f"Đã mở khóa {updated_count} cửa hàng thành công"})


class SellerPendingListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return Seller.objects.filter(status="pending")

# --- CÁC API BÁO CÁO & THỐNG KÊ ---

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def agriculture_report(request):
    sellers = Seller.objects.filter(status='active').prefetch_related('user')
    report_data = []
    
    for seller in sellers:
        seller_products = Product.objects.filter(seller=seller)
        orders = Order.objects.filter(items__product__in=seller_products, is_deleted=False).distinct()
        
        total_revenue = orders.filter(status='completed').aggregate(total=Sum('total_price'))['total'] or 0
        total_orders = orders.count()
        cancelled_orders = orders.filter(status='cancelled').count()
        cancel_rate = round((cancelled_orders / total_orders * 100) if total_orders > 0 else 0, 1)
        
        delay_orders = orders.filter(status__in=['out_for_delivery', 'delivery_failed']).count()
        delay_rate = round((delay_orders / total_orders * 100) if total_orders > 0 else 0, 1)
        
        avg_rating = seller_products.aggregate(avg=Avg('rating'))['avg'] or 0
        avg_rating = round(float(avg_rating), 1)
        
        product_count = seller_products.count()
        success_orders = orders.filter(status='completed').count()
        avg_delivery_days = 2.5
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
    
    return Response({'data': report_data, 'total': len(report_data), 'timestamp': timezone.now()})

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def category_report_api(request):
    category_stats = OrderItem.objects.filter(order__status='completed').values(name=F('product__category__name')).annotate(
        value=Sum(F('price') * F('quantity'), output_field=FloatField()),
        total_sold=Sum('quantity')
    ).order_by('-value')

    results = []
    for item in category_stats:
        if item['name'] is None: item['name'] = 'Chưa phân loại'
        results.append(item)

    return Response({'data': results, 'timestamp': timezone.now()})

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def seller_activity_history(request, seller_id):
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)

    logs = SellerActivityLog.objects.filter(seller=seller).order_by("-created_at")[:30]
    serializer = SellerActivityLogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def seller_products_list(request, seller_id):
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)
    
    products = Product.objects.filter(seller=seller).order_by('-created_at')
    serializer = ProductListSerializer(products, many=True)
    
    return Response({'seller_id': seller.id, 'store_name': seller.store_name, 'results': serializer.data, 'count': products.count()})

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def seller_orders_list(request, seller_id):
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)
    
    order_ids = OrderItem.objects.filter(product__seller=seller).values_list('order_id', flat=True).distinct()
    orders = Order.objects.filter(id__in=order_ids).order_by('-created_at').prefetch_related('items', 'items__product')
    
    orders_data = []
    for order in orders:
        total_commission = 0
        items_list = []
        for item in order.items.all():
            commission_rate = item.product.category.commission_rate if item.product and item.product.category else 0
            item_total = float(item.price) * item.quantity
            item_commission = item_total * commission_rate
            total_commission += item_commission
            
            items_list.append({
                'id': item.id,
                'product': {'id': item.product.id, 'name': item.product.name} if item.product else None,
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
    
    return Response({'seller_id': seller.id, 'store_name': seller.store_name, 'results': orders_data, 'count': len(orders_data)})

@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def seller_analytics_detail(request, seller_id):
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)

    products = Product.objects.filter(seller=seller)
    total_products = products.count()
    active_products = products.filter(status="approved").count()
    hidden_products = products.filter(is_hidden=True).count()

    order_ids = OrderItem.objects.filter(product__seller=seller).values_list("order_id", flat=True).distinct()
    orders = Order.objects.filter(id__in=order_ids)
    total_orders = orders.count()

    overview = {"total_products": total_products, "active_products": active_products, "hidden_products": hidden_products, "total_orders": total_orders}

    # Simplified Performance
    now = timezone.now()
    month_start = date(now.year, now.month, 1)
    revenue_qs_all = OrderItem.objects.filter(product__seller=seller, order__status="completed").select_related('order')
    
    this_month_items = [item for item in revenue_qs_all if item.order.created_at.date() >= month_start]
    this_month_revenue = sum(float(item.price * item.quantity) for item in this_month_items)
    
    finance = {"total_revenue": this_month_revenue, "total_commission": this_month_revenue * 0.1, "available_balance": this_month_revenue * 0.9}

    return Response({
        "overview": overview,
        "performance": {"growth_rate": 0, "revenue_trend": [], "order_trend": [], "cancel_rate": 0, "return_rate": 0},
        "top_products": [],
        "finance": finance,
        "withdrawal_history": [],
        "reviews": {"avg_rating": 0, "total_reviews": 0},
        "rating_distribution": {},
        "review_list": [],
        "positive_keywords": [],
        "negative_keywords": [],
        "response_rate": 0,
        "responded_count": 0
    })

# [MỚI] API Chuyển trạng thái về Chờ duyệt (Revert to Pending)
class SellerSetPendingAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        seller = get_object_or_404(Seller, pk=pk)
        
        # Chỉ cho phép nếu đang là approved hoặc rejected
        if seller.status not in ['approved', 'rejected']:
             return Response({"detail": "Chỉ có thể hoàn tác hồ sơ đã duyệt hoặc từ chối."}, status=400)
             
        seller.status = "pending"
        seller.rejection_reason = None # Xóa lý do từ chối nếu có
        seller.save()
        
        return Response({"status": seller.status, "message": "Đã chuyển hồ sơ về trạng thái chờ duyệt"})