from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum, Count, F, FloatField, Avg
from django.db.models.functions import TruncDay, TruncHour
from django.utils import timezone
from datetime import timedelta, datetime, date

# Import Models
from sellers.models import Seller
from products.models import Product
from orders.models import Order, OrderItem

# Kiểm tra xem ProductView có tồn tại không
try:
    from products.models import ProductView
except ImportError:
    ProductView = None

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def get_date_range(period, custom_start=None, custom_end=None):
    now = timezone.now()
    end_date = now

    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        compare_start = start_date - timedelta(days=1)
        compare_end = end_date - timedelta(days=1)
    elif period == "7days":
        start_date = now - timedelta(days=7)
        compare_start = start_date - timedelta(days=7)
        compare_end = start_date
    elif period == "30days":
        start_date = now - timedelta(days=30)
        compare_start = start_date - timedelta(days=30)
        compare_end = start_date
    elif period == "custom" and custom_start and custom_end:
        try:
            if isinstance(custom_start, str):
                start_date = datetime.fromisoformat(custom_start.replace('Z', '+00:00'))
            else:
                start_date = custom_start
            
            if isinstance(custom_end, str):
                end_date = datetime.fromisoformat(custom_end.replace('Z', '+00:00'))
            else:
                end_date = custom_end

            days_diff = (end_date - start_date).days
            compare_start = start_date - timedelta(days=days_diff)
            compare_end = start_date
        except ValueError:
            start_date = now - timedelta(days=30)
            compare_start = start_date - timedelta(days=30)
            compare_end = start_date
    else:
        start_date = now - timedelta(days=30)
        compare_start = start_date - timedelta(days=30)
        compare_end = start_date

    return start_date, end_date, compare_start, compare_end

def calculate_growth(current, previous):
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)

def get_revenue_from_items(items):
    """Tính tổng tiền từ danh sách OrderItem"""
    return items.aggregate(
        total=Sum(F('price') * F('quantity'), output_field=FloatField())
    )['total'] or 0.0

# ==========================================
# API VIEWS CHO SELLER CENTER (DASHBOARD)
# ==========================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    """Tab 1: Overview Dashboard"""
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    period = request.GET.get("period", "30days")
    start_str = request.GET.get("start_date")
    end_str = request.GET.get("end_date")
    
    start_date, end_date, comp_start, comp_end = get_date_range(period, start_str, end_str)
    COMPLETED_STATUSES = ['completed', 'delivered', 'success']
    
    current_items = OrderItem.objects.filter(
        product__seller=seller,
        order__created_at__gte=start_date,
        order__created_at__lte=end_date
    )
    previous_items = OrderItem.objects.filter(
        product__seller=seller,
        order__created_at__gte=comp_start,
        order__created_at__lt=comp_end
    )

    # KPIs
    curr_revenue = get_revenue_from_items(current_items.filter(order__status__in=COMPLETED_STATUSES))
    prev_revenue = get_revenue_from_items(previous_items.filter(order__status__in=COMPLETED_STATUSES))

    curr_orders = current_items.filter(order__status__in=COMPLETED_STATUSES).values('order').distinct().count()
    prev_orders = previous_items.filter(order__status__in=COMPLETED_STATUSES).values('order').distinct().count()

    # Visits (Mock nếu không có ProductView)
    curr_visits = curr_orders * 15 
    prev_visits = prev_orders * 15
    if ProductView:
        curr_visits = ProductView.objects.filter(product__seller=seller, created_at__gte=start_date, created_at__lte=end_date).count()
        prev_visits = ProductView.objects.filter(product__seller=seller, created_at__gte=comp_start, created_at__lt=comp_end).count()

    curr_conv = (curr_orders / curr_visits * 100) if curr_visits > 0 else 0
    prev_conv = (prev_orders / prev_visits * 100) if prev_visits > 0 else 0
    curr_aov = (curr_revenue / curr_orders) if curr_orders > 0 else 0
    prev_aov = (prev_revenue / prev_orders) if prev_orders > 0 else 0

    kpis = {
        "revenue": {"value": curr_revenue, "growth": calculate_growth(curr_revenue, prev_revenue)},
        "orders": {"value": curr_orders, "growth": calculate_growth(curr_orders, prev_orders)},
        "visits": {"value": curr_visits, "growth": calculate_growth(curr_visits, prev_visits)},
        "conversion_rate": {"value": round(curr_conv, 2), "growth": calculate_growth(curr_conv, prev_conv)},
        "aov": {"value": round(curr_aov, 0), "growth": calculate_growth(curr_aov, prev_aov)},
    }

    # Trend Chart
    trend_qs = current_items.filter(order__status__in=COMPLETED_STATUSES).annotate(
        day=TruncDay('order__created_at')
    ).values('day').annotate(
        revenue=Sum(F('price') * F('quantity'), output_field=FloatField()),
        orders=Count('order', distinct=True)
    ).order_by('day')

    trend_chart = [{"date": item['day'].strftime("%Y-%m-%d"), "revenue": item['revenue'] or 0, "orders": item['orders']} for item in trend_qs]

    # Top Products
    top_products_qs = current_items.filter(order__status__in=COMPLETED_STATUSES).values(
        'product__id', 'product__name', 'product__image'
    ).annotate(
        revenue=Sum(F('price') * F('quantity'), output_field=FloatField()),
        units_sold=Sum('quantity')
    ).order_by('-revenue')[:5]

    top_products = []
    for item in top_products_qs:
        image_url = f"/media/{item['product__image']}" if item.get('product__image') and not str(item['product__image']).startswith('http') else item.get('product__image')
        top_products.append({
            "id": item['product__id'],
            "name": item['product__name'],
            "image": image_url,
            "revenue": item['revenue'],
            "units_sold": item['units_sold']
        })

    return Response({
        "kpis": kpis,
        "trend_chart": trend_chart,
        "top_products": top_products,
        "funnel": {"visits": curr_visits, "product_views": int(curr_visits * 0.8), "orders": curr_orders},
        "period": {"start": start_date.isoformat(), "end": end_date.isoformat()}
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_sales(request):
    """Tab 2: Sales Analysis"""
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    period = request.GET.get("period", "30days")
    start_date, end_date, _, _ = get_date_range(period)
    COMPLETED_STATUSES = ['completed', 'delivered', 'success']
    
    sales_items = OrderItem.objects.filter(product__seller=seller, order__created_at__gte=start_date, order__created_at__lte=end_date, order__status__in=COMPLETED_STATUSES)

    revenue_by_time = []
    if period == "today":
        hourly_data = sales_items.annotate(hour=TruncHour('order__created_at')).values('hour').annotate(revenue=Sum(F('price') * F('quantity'), output_field=FloatField())).order_by('hour')
        revenue_by_time = [{"time": item['hour'].strftime("%H:00"), "revenue": item['revenue'] or 0} for item in hourly_data]
    else:
        daily_data = sales_items.annotate(day=TruncDay('order__created_at')).values('day').annotate(revenue=Sum(F('price') * F('quantity'), output_field=FloatField())).order_by('day')
        revenue_by_time = [{"time": item['day'].strftime("%Y-%m-%d"), "revenue": item['revenue'] or 0} for item in daily_data]

    location_qs = sales_items.values('order__address').annotate(revenue=Sum(F('price') * F('quantity'), output_field=FloatField()), orders=Count('order', distinct=True)).order_by('-revenue')[:10]
    revenue_by_location = [{"province": (item['order__address'] or "Unknown").split(',')[-1].strip(), "orders": item['orders'], "revenue": item['revenue']} for item in location_qs]

    all_period_items = OrderItem.objects.filter(product__seller=seller, order__created_at__gte=start_date, order__created_at__lte=end_date)
    total_ops = all_period_items.values('order').distinct().count() or 1
    
    operational_metrics = {
        "success_rate": round((all_period_items.filter(order__status__in=COMPLETED_STATUSES).values('order').distinct().count() / total_ops * 100), 2),
        "cancel_rate": round((all_period_items.filter(order__status='cancelled').values('order').distinct().count() / total_ops * 100), 2),
        "return_rate": round((all_period_items.filter(order__status='returned').values('order').distinct().count() / total_ops * 100), 2)
    }

    return Response({"revenue_by_time": revenue_by_time, "revenue_by_location": revenue_by_location, "operational_metrics": operational_metrics})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_products(request):
    """Tab 3: Product Analysis"""
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    period = request.GET.get("period", "30days")
    start_date, end_date, _, _ = get_date_range(period)
    
    products = Product.objects.filter(seller=seller)
    product_performance = []
    
    for product in products:
        sold_items = OrderItem.objects.filter(product=product, order__created_at__gte=start_date, order__created_at__lte=end_date, order__status__in=['completed', 'delivered', 'success'])
        revenue = sold_items.aggregate(t=Sum(F('price') * F('quantity'), output_field=FloatField()))['t'] or 0
        units = sold_items.aggregate(t=Sum('quantity'))['t'] or 0
        
        views = 0
        if ProductView:
            views = ProductView.objects.filter(product=product, created_at__gte=start_date, created_at__lte=end_date).count()
        
        image_url = f"/media/{product.image}" if product.image and not str(product.image).startswith('http') else product.image
        if revenue > 0 or views > 0:
            product_performance.append({
                "id": product.id, "name": product.name, "image": image_url,
                "views": views, "cart_adds": int(units * 1.5), "units_sold": units,
                "revenue": revenue, "conversion_rate": round((units/views*100) if views > 0 else 0, 2)
            })

    product_performance.sort(key=lambda x: x['revenue'], reverse=True)
    
    # Basket Analysis (Simplified)
    orders_with_multi = OrderItem.objects.filter(product__seller=seller, order__created_at__gte=start_date, order__created_at__lte=end_date).values('order').annotate(cnt=Count('id')).filter(cnt__gte=2).values_list('order', flat=True)
    basket_pairs = {}
    target_orders = Order.objects.filter(id__in=orders_with_multi).prefetch_related('items', 'items__product')
    
    for order in target_orders:
        shop_items = [i for i in order.items.all() if i.product and i.product.seller_id == seller.id]
        for i in range(len(shop_items)):
            for j in range(i + 1, len(shop_items)):
                p1, p2 = shop_items[i].product, shop_items[j].product
                pair_key = tuple(sorted([p1.id, p2.id]))
                if pair_key not in basket_pairs:
                    basket_pairs[pair_key] = {"product1_id": p1.id, "product1_name": p1.name, "product2_id": p2.id, "product2_name": p2.name, "frequency": 0}
                basket_pairs[pair_key]["frequency"] += 1

    return Response({"product_performance": product_performance, "basket_analysis": sorted(basket_pairs.values(), key=lambda x: x['frequency'], reverse=True)[:10]})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_traffic(request):
    """Tab 4: Traffic"""
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    period = request.GET.get("period", "30days")
    start_date, end_date, _, _ = get_date_range(period)
    
    period_orders = Order.objects.filter(items__product__seller=seller, created_at__gte=start_date, created_at__lte=end_date).values('user_id').distinct()
    customer_ids = [o['user_id'] for o in period_orders if o['user_id']]
    total_customers = len(customer_ids)
    returning = 0
    
    if total_customers > 0:
        for uid in customer_ids:
            if Order.objects.filter(user_id=uid, items__product__seller=seller, created_at__lt=start_date).exists():
                returning += 1
    
    new_cust = total_customers - returning
    
    customer_analysis = {
        "total_customers": total_customers, "new_customers": new_cust, "returning_customers": returning,
        "retention_rate": round((returning/total_customers*100) if total_customers > 0 else 0, 2),
        "new_percentage": round((new_cust/total_customers*100) if total_customers > 0 else 0, 1),
        "returning_percentage": round((returning/total_customers*100) if total_customers > 0 else 0, 1)
    }

    est_visits = total_customers * 5 if total_customers > 0 else 100
    traffic_sources = [
        {"source": "Tìm kiếm trên sàn", "visits": int(est_visits * 0.45), "percentage": 45},
        {"source": "Trang chủ / Đề xuất", "visits": int(est_visits * 0.25), "percentage": 25},
        {"source": "Mạng xã hội", "visits": int(est_visits * 0.20), "percentage": 20},
        {"source": "Trực tiếp", "visits": int(est_visits * 0.10), "percentage": 10}
    ]

    # Keywords from product names
    top_selling = OrderItem.objects.filter(product__seller=seller, order__created_at__gte=start_date).values_list('product__name', flat=True)[:20]
    keywords = []
    for name in top_selling: keywords.extend(name.lower().split())
    from collections import Counter
    common = Counter([w for w in keywords if len(w) > 3]).most_common(10)
    
    return Response({"traffic_sources": traffic_sources, "top_keywords": [{"keyword": k, "count": v} for k, v in common], "customer_analysis": customer_analysis})

# ==========================================
# API CHO ADMIN PAGE (Chi tiết Seller)
# ==========================================

@api_view(['GET'])
@permission_classes([IsAdminUser]) # Đã import IsAdminUser ở đầu file
def seller_analytics_detail(request, seller_id):
    """
    API này dùng cho trang Admin (ActiveLockedSellersPage / SellerDetailDrawer)
    Trả về toàn bộ dữ liệu (Overview, Performance, Finance...) trong 1 lần gọi.
    """
    try:
        seller = Seller.objects.get(pk=seller_id)
    except Seller.DoesNotExist:
        return Response({"detail": "Seller not found"}, status=404)

    # 1. Overview
    products = Product.objects.filter(seller=seller)
    seller_items = OrderItem.objects.filter(product__seller=seller)
    
    overview = {
        "total_products": products.count(),
        "active_products": products.filter(status='approved').count(),
        "hidden_products": products.filter(is_hidden=True).count() if hasattr(Product, 'is_hidden') else 0,
        "total_orders": seller_items.values('order').distinct().count(),
    }

    # 2. Performance (7 ngày qua)
    today = timezone.now().date()
    revenue_trend = []
    order_trend = []
    days_map = {0: "Thứ 2", 1: "Thứ 3", 2: "Thứ 4", 3: "Thứ 5", 4: "Thứ 6", 5: "Thứ 7", 6: "CN"}
    COMPLETED = ['completed', 'delivered', 'success']

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        daily_qs = seller_items.filter(order__created_at__date=day)
        
        rev = daily_qs.filter(order__status__in=COMPLETED).aggregate(
            t=Sum(F('price') * F('quantity'), output_field=FloatField())
        )['t'] or 0
        
        ords = daily_qs.values('order').distinct().count()
        
        day_label = days_map[day.weekday()]
        revenue_trend.append({"date": day_label, "revenue": rev})
        order_trend.append({"date": day_label, "orders": ords})

    # Tính Growth Rate (Tháng này vs Tháng trước)
    this_month_start = today.replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    rev_this_month = seller_items.filter(order__created_at__date__gte=this_month_start, order__status__in=COMPLETED).aggregate(t=Sum(F('price') * F('quantity'), output_field=FloatField()))['t'] or 0
    rev_last_month = seller_items.filter(order__created_at__date__gte=last_month_start, order__created_at__date__lte=last_month_end, order__status__in=COMPLETED).aggregate(t=Sum(F('price') * F('quantity'), output_field=FloatField()))['t'] or 0

    # Tỷ lệ Hủy/Hoàn
    total_ops = seller_items.count() or 1
    cancel_rate = round(seller_items.filter(order__status='cancelled').count() / total_ops * 100, 1)
    return_rate = round(seller_items.filter(order__status='returned').count() / total_ops * 100, 1)

    performance = {
        "growth_rate": calculate_growth(rev_this_month, rev_last_month),
        "revenue_trend": revenue_trend,
        "order_trend": order_trend,
        "cancel_rate": cancel_rate,
        "cancel_count": seller_items.filter(order__status='cancelled').count(),
        "return_rate": return_rate,
        "return_count": seller_items.filter(order__status='returned').count(),
    }

    # 3. Top Products (Top 5)
    top_products_qs = seller_items.filter(order__status__in=COMPLETED).values('product__name').annotate(revenue=Sum(F('price') * F('quantity'), output_field=FloatField()), quantity=Sum('quantity')).order_by('-revenue')[:5]
    top_products = [{"name": item['product__name'], "quantity": item['quantity'], "revenue": item['revenue']} for item in top_products_qs]

    # 4. Finance (Tháng này)
    finance = {
        "total_revenue": rev_this_month,
        "total_commission": rev_this_month * 0.1, # Giả định 10%
        "available_balance": rev_this_month * 0.9
    }

    # 5. Reviews (Mock hoặc tính từ Product Rating)
    avg_rating = products.aggregate(avg=Avg('rating'))['avg'] or 0
    reviews_data = {"avg_rating": round(avg_rating, 1), "total_reviews": 0} # Có thể count review thật nếu có model

    return Response({
        "overview": overview,
        "performance": performance,
        "top_products": top_products,
        "finance": finance,
        "withdrawal_history": [],
        "reviews": reviews_data,
        "rating_distribution": {},
        "review_list": [],
        "positive_keywords": [],
        "negative_keywords": [],
        "response_rate": 0,
        "responded_count": 0
    })