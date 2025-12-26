# views/dashboard.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, F, Q, Prefetch, DecimalField
from django.utils.timezone import now
from datetime import timedelta
from django.core.cache import cache
from django.db import models

from users.models import CustomUser
from products.models import Product
from orders.models import Order, OrderItem
from sellers.models import Seller
from complaints.models import Complaint

from django.db.models.functions import TruncMonth

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    # ✅ Cache kết quả để tránh truy vấn đắt đỏ
    cache_key = 'dashboard_data_cache'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    today = now().date()
    one_year_ago = today - timedelta(days=365)

    # --- ✅ Tối ưu: Lấy tất cả counts trong 1 query ---
    user_stats = CustomUser.objects.aggregate(
        total_users=Count('id'),
        new_users_today=Count('id', filter=Q(date_joined__date=today))
    )
    
    seller_count = Seller.objects.count()
    customer_count = CustomUser.objects.filter(role__name="customer").count()
    product_count = Product.objects.count()

    # --- ✅ Tối ưu Orders: Một query duy nhất ---
    base_stats = Order.objects.aggregate(
        total_orders=Count('id'),
        total_revenue=Sum('total_price', filter=Q(status__in=["completed", "delivered"])),
        new_orders_today=Count('id', filter=Q(created_at__date=today)),
        processing_orders=Count('id', filter=Q(status__in=["pending", "shipping", "ready_to_pick", "picking"])),
        cancelled_orders=Count('id', filter=Q(status="cancelled"))
    )

    total_orders = base_stats['total_orders'] or 0
    total_revenue = base_stats['total_revenue'] or 0
    new_orders_today = base_stats['new_orders_today'] or 0
    processing_orders = base_stats['processing_orders'] or 0
    cancelled_orders = base_stats['cancelled_orders'] or 0
    cancel_rate = round((cancelled_orders / total_orders * 100), 2) if total_orders > 0 else 0

    # --- ✅ Complaints: Một query, không cần select_related nếu ko dùng nested fields ---
    new_complaints = Complaint.objects.filter(created_at__date=today).count()

    # --- ✅ Revenue 12 tháng: Query tối ưu ---
    revenue_query = (
        Order.objects.filter(
            status__in=["completed", "delivered"],
            created_at__date__gte=one_year_ago.replace(day=1)
        )
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(total=Sum('total_price'))
        .order_by('month')
    )

    revenue_by_month = [
        {"month": item['month'].strftime("%b"), "revenue": float(item['total'] or 0)}
        for item in revenue_query
    ]

    # --- ✅ Top 5 sản phẩm: Query tối ưu ---
    top_products = list(
        OrderItem.objects.values(
            prod_id=F("product__id"),
            prod_name=F("product__name"),
            shop_name=F("product__seller__store_name"),
            thumbnail=F("product__image")
        )
        .annotate(
            quantity_sold=Sum("quantity")
        )
        .order_by("-quantity_sold")[:5]
    )
    
    # Tính revenue sau
    for item in top_products:
        try:
            product = Product.objects.get(id=item['prod_id'])
            item['revenue'] = product.original_price * item['quantity_sold'] if product.original_price else 0
        except:
            item['revenue'] = 0

    # --- ✅ Orders by status ---
    orders_by_status = list(
        Order.objects.values(status_name=F("status"))
        .annotate(count=Count("id"))
        .order_by("status")
    )

    # --- ✅ Recent orders: Select related để lấy user name một lần ---
    recent_orders = list(
        Order.objects.select_related('user')
        .order_by('-created_at')[:5]
        .values('id', 'total_price', 'status', 'created_at', user_name=F('user__full_name'))
    )
    
    # --- ✅ Recent disputes: Only select what's needed ---
    recent_disputes = list(
        Complaint.objects
        .select_related('user', 'order_item', 'order_item__product')
        .order_by('-created_at')[:5]
        .values(
            'id', 'reason', 'status', 'created_at',
            user_name=F('user__full_name'),
            product_name=F('order_item__product__name'),
            product_image=F('order_item__product__image'),
            order_id=F('order_item__order__id')
        )
    )

    data = {
        "total_users": user_stats['total_users'],
        "total_sellers": seller_count,
        "total_customers": customer_count,
        "total_products": product_count,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue) if total_revenue else 0.0,
        "new_orders_today": new_orders_today,
        "processing_orders": processing_orders,
        "new_complaints": new_complaints,
        "new_users_today": user_stats['new_users_today'],
        "cancel_rate": cancel_rate,
        "top_products": top_products,
        "revenue_by_month": revenue_by_month,
        "orders_by_status": orders_by_status,
        "recent_orders": recent_orders,
        "recent_disputes": recent_disputes,
    }

    # ✅ Cache 5 phút
    cache.set(cache_key, data, 300)
    
    return Response(data)
