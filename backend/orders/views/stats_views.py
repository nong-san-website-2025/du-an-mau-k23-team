from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate, Coalesce
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from ..models import Order, OrderItem
from complaints.models import Complaint
from products.models import ProductImage

User = get_user_model()

# ================= USER STATS =================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_behavior_stats(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    successful_orders = Order.objects.filter(
        user=user,
        status__in=['completed', 'delivered', 'shipping', 'out_for_delivery', 'ready_to_pick', 'picking']
    )
    total_orders = successful_orders.count()
    total_spent = successful_orders.aggregate(total=Sum('total_price'))['total'] or 0

    ninety_days_ago = timezone.now() - timedelta(days=90)
    purchase_frequency_90d = successful_orders.filter(created_at__gte=ninety_days_ago).count()

    total_returned = Order.objects.filter(user=user, status='returned').count()
    return_rate = round((total_returned / total_orders) * 100, 1) if total_orders > 0 else 0

    total_complaints = Complaint.objects.filter(user=user).count()
    complaint_rate = round((total_complaints / total_orders) * 100, 1) if total_orders > 0 else 0

    purchased_products_qs = (
        OrderItem.objects.filter( 
            order__user=user,
            order__status__in=['completed', 'delivered'],
        )
        .select_related('product')
        .values('product_id', 'product__name', 'product__image')
        .annotate(purchase_count=Sum('quantity'))
        .order_by('-purchase_count')[:5]
    )

    purchased_products = []
    for item in purchased_products_qs:
        image_url = None
        if item.get('product__image'):
             image_url = request.build_absolute_uri(settings.MEDIA_URL + item['product__image'])
        
        purchased_products.append({
            "id": item['product_id'],
            "name": item['product__name'],
            "image": image_url,
            "purchase_count": item['purchase_count'],
            "view_count": 0 
        })

    categories_qs = (
        OrderItem.objects.filter(
            order__user=user,
            order__status__in=['completed', 'delivered', 'shipping']
        )
        .select_related('product__subcategory__category')
        .values('product__subcategory__category_id', 'product__subcategory__category__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    interested_categories = [
        {"id": item['product__subcategory__category_id'], "name": item['product__subcategory__category__name']}
        for item in categories_qs if item['product__subcategory__category_id']
    ]

    return Response({
        "total_orders": total_orders,
        "total_spent": int(total_spent),
        "purchase_frequency_90d": purchase_frequency_90d,
        "return_rate": return_rate,
        "complaint_rate": complaint_rate,
        "purchased_products": purchased_products,
        "interested_categories": interested_categories,
    })

# ================= ADMIN DASHBOARD =================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_report(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not start_date or not end_date:
        return Response({"error": "start_date and end_date required"}, status=400)

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return Response({"error": "Invalid date format"}, status=400)

    orders = Order.objects.filter(
        created_at__date__gte=start.date(),
        created_at__date__lte=end.date(),
        is_deleted=False
    )
    success_orders = orders.filter(status='completed')
    total_revenue = success_orders.aggregate(total=Sum('total_price'))['total'] or 0

    platform_revenue = 0.0
    success_order_items = OrderItem.objects.filter(
        order__in=success_orders
    ).select_related('product', 'product__category')
    
    for item in success_order_items:
        if item.product and item.product.category:
            category = item.product.category
            commission_rate = getattr(category, 'commission_rate', 0.0)
            item_amount = item.price * item.quantity 
            rate = Decimal(str(commission_rate))
            platform_revenue += item_amount * rate

    daily_revenue = success_orders.values(date=TruncDate('created_at')).annotate(revenue=Sum('total_price')).order_by('date')
    
    daily_platform_revenue = []
    for day in daily_revenue:
        day_items = OrderItem.objects.filter(
            order__status='completed',
            order__created_at__date=day['date']
        ).select_related('product', 'product__category')
        
        day_commission = 0.0
        for item in day_items:
            if item.product and item.product.category:
                commission_rate = getattr(item.product.category, 'commission_rate', 0.0)
                item_amount = float(item.price) * item.quantity
                commission = item_amount * float(commission_rate) # Ép kiểu thống nhất
                day_commission += commission
        
        daily_platform_revenue.append({
            'date': day['date'].isoformat(),
            'revenue': float(day['revenue'] or 0),
            'platform_revenue': day_commission
        })

    return Response({
        'total_revenue': float(total_revenue),
        'platform_revenue': float(platform_revenue),
        'success_orders_count': success_orders.count(),
        'pending_orders_count': orders.filter(status__in=['pending', 'processing', 'shipping']).count(),
        'cancelled_orders_count': orders.filter(status='cancelled').count(),
        'daily_revenue': daily_platform_revenue
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_statistics_report(request):
    total_orders = Order.objects.count()
    total_revenue = Order.objects.filter(status__in=['completed', 'delivered']).aggregate(total=Sum('total_price'))['total'] or 0
    successful_deliveries = Order.objects.filter(status__in=['completed', 'delivered']).count()
    on_time_rate = round((successful_deliveries / total_orders * 100), 1) if total_orders > 0 else 0
    cancelled_orders = Order.objects.filter(status='cancelled').count()
    cancel_rate = round((cancelled_orders / total_orders * 100), 1) if total_orders > 0 else 0

    order_status_data = Order.objects.values('status').annotate(count=Count('id')).order_by('status')
    status_labels = {
        'pending': 'Chờ xác nhận', 'shipping': 'Đang vận chuyển',
        'delivered': 'Đã giao hàng', 'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy', 'returned': 'Trả hàng/Hoàn tiền',
    }
    order_status_chart_data = [{'name': status_labels.get(item['status'], item['status']), 'value': item['count']} for item in order_status_data]

    # Mock Data
    delivery_time_data = [
        {'name': 'T7', 'avg': 2.1, 'late': 15}, {'name': 'CN', 'avg': 2.5, 'late': 21},
        {'name': 'T2', 'avg': 1.9, 'late': 10}, {'name': 'T3', 'avg': 2.2, 'late': 13},
        {'name': 'T4', 'avg': 2.3, 'late': 18}, {'name': 'T5', 'avg': 2.0, 'late': 12},
        {'name': 'T6', 'avg': 2.4, 'late': 16},
    ]
    shipping_cost_data = [
        {'name': 'GHN', 'cost': 1200000}, {'name': 'GHTK', 'cost': 1500000},
        {'name': 'Viettel Post', 'cost': 900000}, {'name': 'J&T', 'cost': 1100000},
    ]

    return Response({
        'orderSummary': {'totalOrders': total_orders, 'revenue': float(total_revenue), 'onTimeRate': on_time_rate, 'cancelRate': cancel_rate},
        'orderStatusData': order_status_chart_data,
        'deliveryTimeData': delivery_time_data,
        'shippingCostData': shipping_cost_data,
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    start_str = request.query_params.get('start_date')
    end_str = request.query_params.get('end_date')

    if start_str and end_str:
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
            start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        except ValueError:
             return Response({"error": "Invalid date format"}, status=400)
    else:
        end_datetime = timezone.now()
        start_datetime = end_datetime - timedelta(days=7)

    orders = Order.objects.filter(created_at__range=(start_datetime, end_datetime), is_deleted=False)
    total_orders = orders.count()
    revenue_orders = orders.filter(status='completed')
    total_revenue = revenue_orders.aggregate(total=Coalesce(Sum('total_price'), 0.0, output_field=models.DecimalField()))['total']

    cancelled_count = orders.filter(status='cancelled').count()
    returned_count = orders.filter(status='returned').count()
    cancel_rate = round((cancelled_count / total_orders * 100), 2) if total_orders > 0 else 0
    return_rate = round((returned_count / total_orders * 100), 2) if total_orders > 0 else 0
    avg_order_value = round(total_revenue / revenue_orders.count()) if revenue_orders.exists() else 0

    trend_data = orders.annotate(date=TruncDate('created_at')).values('date').annotate(orders=Count('id')).order_by('date')
    revenue_trend = revenue_orders.annotate(date=TruncDate('created_at')).values('date').annotate(revenue=Sum('total_price')).order_by('date')
    
    chart_trend = []
    rev_dict = {item['date']: item['revenue'] for item in revenue_trend}
    for item in trend_data:
        chart_trend.append({
            "date": item['date'].strftime('%d/%m'),
            "orders": item['orders'],
            "revenue": rev_dict.get(item['date'], 0)
        })

    status_map = {'pending': 'Chờ xác nhận', 'shipping': 'Đang vận chuyển', 'delivered': 'Đã giao hàng', 'completed': 'Hoàn thành', 'cancelled': 'Đã hủy', 'returned': 'Trả hàng'}
    status_data_qs = orders.values('status').annotate(value=Count('id'))
    chart_status = [{"name": status_map.get(item['status'], item['status']), "value": item['value']} for item in status_data_qs]

    payment_methods_qs = orders.values('payment_method').annotate(count=Count('id'))
    payment_methods = [{"name": item['payment_method'] or "Khác", "value": item['count']} for item in payment_methods_qs]

    top_products_qs = (
        OrderItem.objects.filter(order__in=revenue_orders)
        .values('product__id', 'product__name')
        .annotate(sold=Sum('quantity'), revenue=Sum(F('quantity') * F('price')))
        .order_by('-sold')[:5]
    )

    top_products = []
    for p in top_products_qs:
        prod_img = ProductImage.objects.filter(product_id=p['product__id']).first()
        img = request.build_absolute_uri(settings.MEDIA_URL + str(prod_img.image)) if prod_img else "https://via.placeholder.com/40"
        top_products.append({"id": p['product__id'], "name": p['product__name'], "sold": p['sold'], "revenue": p['revenue'], "img": img})

    recent_orders_qs = orders.select_related('user').order_by('-created_at')[:10]
    recent_orders = [{"id": o.id, "customer": (o.user.full_name or o.user.username) if o.user else 'Khách lạ', "total": float(o.total_price) if o.total_price else 0, "status": o.status, "date": o.created_at.strftime('%Y-%m-%d')} for o in recent_orders_qs]

    return Response({
        "stats": {"totalOrders": total_orders, "revenue": total_revenue, "avgOrderValue": avg_order_value, "cancelRate": cancel_rate, "returnRate": return_rate},
        "chartData": {"trend": chart_trend, "status": chart_status, "paymentMethods": payment_methods},
        "topProducts": top_products,
        "recentOrders": recent_orders
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_products_filter(request):
    filter_type = request.query_params.get("filter", "month") 
    today = timezone.now().date()
    start_date = today.replace(day=1) # month
    if filter_type == "today": start_date = today
    elif filter_type == "week": start_date = today - timedelta(days=today.weekday())

    items = (
        OrderItem.objects.filter(order__created_at__date__gte=start_date)
        .values(product_id=F("product__id"), product_name=F("product__name"), shop_name=F("product__seller__store_name"))
        .annotate(quantity_sold=Sum("quantity"), revenue=Sum(F("quantity") * F("price")))
        .order_by("-quantity_sold")[:10]
    )
    return Response(list(items))