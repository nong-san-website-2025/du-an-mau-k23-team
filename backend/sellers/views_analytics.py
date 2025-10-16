"""
Analytics API Views for Seller Center
Provides comprehensive analytics data for sellers including:
- KPIs (Revenue, Orders, Conversion Rate, AOV)
- Sales trends and comparisons
- Product performance analysis
- Geographic sales distribution
- Traffic sources and customer insights
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncHour
from django.utils import timezone
from datetime import timedelta, datetime
from sellers.models import Seller
from products.models import Product
from orders.models import Order, OrderItem
from payments.models import Payment
import json


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    """
    Tab 1: Overview Dashboard
    Returns KPIs and main trend data for selected time period
    Query params: period (today, 7days, 30days, custom), start_date, end_date
    """
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    # Parse time period
    period = request.GET.get("period", "30days")
    now = timezone.now()
    
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
        compare_start = start_date - timedelta(days=1)
        compare_end = start_date
    elif period == "7days":
        start_date = now - timedelta(days=7)
        end_date = now
        compare_start = start_date - timedelta(days=7)
        compare_end = start_date
    elif period == "30days":
        start_date = now - timedelta(days=30)
        end_date = now
        compare_start = start_date - timedelta(days=30)
        compare_end = start_date
    elif period == "custom":
        start_date = datetime.fromisoformat(request.GET.get("start_date"))
        end_date = datetime.fromisoformat(request.GET.get("end_date"))
        days_diff = (end_date - start_date).days
        compare_start = start_date - timedelta(days=days_diff)
        compare_end = start_date
    else:
        start_date = now - timedelta(days=30)
        end_date = now
        compare_start = start_date - timedelta(days=30)
        compare_end = start_date

    # Get seller's products and orders
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    
    # Current period data
    current_orders = Order.objects.filter(
        id__in=order_ids,
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    current_payments = Payment.objects.filter(
        order_id__in=order_ids,
        status="success",
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    # Previous period data for comparison
    previous_orders = Order.objects.filter(
        id__in=order_ids,
        created_at__gte=compare_start,
        created_at__lt=compare_end
    )
    
    previous_payments = Payment.objects.filter(
        order_id__in=order_ids,
        status="success",
        created_at__gte=compare_start,
        created_at__lt=compare_end
    )
    
    # Calculate KPIs
    current_revenue = current_payments.aggregate(total=Sum("amount"))["total"] or 0
    previous_revenue = previous_payments.aggregate(total=Sum("amount"))["total"] or 0
    
    current_order_count = current_orders.filter(status__in=["success", "delivered"]).count()
    previous_order_count = previous_orders.filter(status__in=["success", "delivered"]).count()
    
    # Mock visits data (in real app, track with analytics service)
    current_visits = current_order_count * 10  # Estimate: 10% conversion rate
    previous_visits = previous_order_count * 10
    
    # Conversion rate
    conversion_rate = (current_order_count / current_visits * 100) if current_visits > 0 else 0
    previous_conversion_rate = (previous_order_count / previous_visits * 100) if previous_visits > 0 else 0
    
    # Average Order Value
    aov = (current_revenue / current_order_count) if current_order_count > 0 else 0
    previous_aov = (previous_revenue / previous_order_count) if previous_order_count > 0 else 0
    
    # Calculate growth percentages
    def calc_growth(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return ((current - previous) / previous) * 100
    
    kpis = {
        "revenue": {
            "value": float(current_revenue),
            "growth": calc_growth(current_revenue, previous_revenue)
        },
        "orders": {
            "value": current_order_count,
            "growth": calc_growth(current_order_count, previous_order_count)
        },
        "visits": {
            "value": current_visits,
            "growth": calc_growth(current_visits, previous_visits)
        },
        "conversion_rate": {
            "value": round(conversion_rate, 2),
            "growth": calc_growth(conversion_rate, previous_conversion_rate)
        },
        "aov": {
            "value": float(aov),
            "growth": calc_growth(aov, previous_aov)
        }
    }
    
    # Trend data for chart (daily breakdown)
    trend_data = current_payments.annotate(
        day=TruncDay("created_at")
    ).values("day").annotate(
        revenue=Sum("amount"),
        orders=Count("id")
    ).order_by("day")
    
    trend_chart = [
        {
            "date": item["day"].strftime("%Y-%m-%d"),
            "revenue": float(item["revenue"] or 0),
            "orders": item["orders"]
        }
        for item in trend_data
    ]
    
    # Top 5 products by revenue
    top_products_data = OrderItem.objects.filter(
        order_id__in=current_orders.values_list("id", flat=True),
        product_id__in=product_ids
    ).values(
        "product__id",
        "product__name",
        "product__image"
    ).annotate(
        revenue=Sum(F("price") * F("quantity")),
        units_sold=Sum("quantity")
    ).order_by("-revenue")[:5]
    
    top_products = [
        {
            "id": item["product__id"],
            "name": item["product__name"],
            "image": request.build_absolute_uri(f"/media/{item['product__image']}") if item["product__image"] else None,
            "revenue": float(item["revenue"] or 0),
            "units_sold": item["units_sold"]
        }
        for item in top_products_data
    ]
    
    # Sales funnel (simplified)
    product_views = current_visits  # Mock data
    orders_count = current_order_count
    
    funnel = {
        "visits": current_visits,
        "product_views": product_views,
        "orders": orders_count
    }
    
    return Response({
        "kpis": kpis,
        "trend_chart": trend_chart,
        "top_products": top_products,
        "funnel": funnel,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_sales(request):
    """
    Tab 2: Sales Analysis
    Returns detailed sales breakdown by time, location, and operational metrics
    """
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    # Get time period
    period = request.GET.get("period", "30days")
    now = timezone.now()
    
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7days":
        start_date = now - timedelta(days=7)
    elif period == "30days":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=30)
    
    end_date = now
    
    # Get seller's data
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    
    orders = Order.objects.filter(
        id__in=order_ids,
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    payments = Payment.objects.filter(
        order_id__in=order_ids,
        status="success",
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    # Revenue by hour (for today only)
    if period == "today":
        hourly_data = payments.annotate(
            hour=TruncHour("created_at")
        ).values("hour").annotate(
            revenue=Sum("amount")
        ).order_by("hour")
        
        revenue_by_time = [
            {
                "time": item["hour"].strftime("%H:00"),
                "revenue": float(item["revenue"] or 0)
            }
            for item in hourly_data
        ]
    else:
        # Revenue by day of week
        daily_data = payments.annotate(
            day=TruncDay("created_at")
        ).values("day").annotate(
            revenue=Sum("amount")
        ).order_by("day")
        
        revenue_by_time = [
            {
                "time": item["day"].strftime("%Y-%m-%d"),
                "revenue": float(item["revenue"] or 0)
            }
            for item in daily_data
        ]
    
    # Revenue by location (province/city)
    # Extract province from address field
    location_data = orders.filter(
        status__in=["success", "delivered"]
    ).values("address").annotate(
        count=Count("id"),
        revenue=Sum("total_price")
    ).order_by("-revenue")[:10]
    
    # Simple province extraction (you may need more sophisticated parsing)
    revenue_by_location = []
    for item in location_data:
        address = item["address"] or ""
        # Try to extract province (last part of address usually)
        parts = address.split(",")
        province = parts[-1].strip() if parts else "Unknown"
        
        revenue_by_location.append({
            "province": province,
            "orders": item["count"],
            "revenue": float(item["revenue"] or 0)
        })
    
    # Operational metrics
    total_orders = orders.count()
    success_orders = orders.filter(status__in=["success", "delivered"]).count()
    cancelled_orders = orders.filter(status="cancelled").count()
    returned_orders = orders.filter(status="returned").count()
    
    operational_metrics = {
        "success_rate": round((success_orders / total_orders * 100) if total_orders > 0 else 0, 2),
        "cancel_rate": round((cancelled_orders / total_orders * 100) if total_orders > 0 else 0, 2),
        "return_rate": round((returned_orders / total_orders * 100) if total_orders > 0 else 0, 2)
    }
    
    return Response({
        "revenue_by_time": revenue_by_time,
        "revenue_by_location": revenue_by_location,
        "operational_metrics": operational_metrics
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_products(request):
    """
    Tab 3: Product Analysis
    Returns detailed product performance metrics and basket analysis
    """
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    # Get time period
    period = request.GET.get("period", "30days")
    now = timezone.now()
    
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7days":
        start_date = now - timedelta(days=7)
    elif period == "30days":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=30)
    
    end_date = now
    
    # Get seller's products
    products = Product.objects.filter(seller=seller)
    product_ids = products.values_list("id", flat=True)
    
    # Get order items in period
    order_items = OrderItem.objects.filter(
        product_id__in=product_ids,
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    # Product performance table
    product_performance = []
    for product in products:
        items = order_items.filter(product=product)
        units_sold = items.aggregate(total=Sum("quantity"))["total"] or 0
        revenue = items.aggregate(total=Sum(F("price") * F("quantity")))["total"] or 0
        
        # Mock views and cart adds (in real app, track these events)
        views = units_sold * 20  # Estimate: 5% view-to-purchase
        cart_adds = units_sold * 5  # Estimate: 20% cart-to-purchase
        
        conversion_rate = (units_sold / views * 100) if views > 0 else 0
        
        product_performance.append({
            "id": product.id,
            "name": product.name,
            "image": request.build_absolute_uri(product.image.url) if product.image else None,
            "views": views,
            "cart_adds": cart_adds,
            "units_sold": units_sold,
            "revenue": float(revenue),
            "conversion_rate": round(conversion_rate, 2)
        })
    
    # Sort by revenue descending
    product_performance.sort(key=lambda x: x["revenue"], reverse=True)
    
    # Basket analysis - find products frequently bought together
    # Get all orders with multiple items
    orders_with_items = OrderItem.objects.filter(
        product_id__in=product_ids,
        created_at__gte=start_date,
        created_at__lte=end_date
    ).values("order_id").annotate(
        item_count=Count("id")
    ).filter(item_count__gte=2).values_list("order_id", flat=True)
    
    # Find product pairs
    basket_pairs = {}
    for order_id in orders_with_items:
        items = OrderItem.objects.filter(
            order_id=order_id,
            product_id__in=product_ids
        ).select_related("product")
        
        products_in_order = list(items)
        # Create pairs
        for i in range(len(products_in_order)):
            for j in range(i + 1, len(products_in_order)):
                p1 = products_in_order[i].product
                p2 = products_in_order[j].product
                
                if p1 and p2:
                    # Create a sorted pair key
                    pair_key = tuple(sorted([p1.id, p2.id]))
                    
                    if pair_key not in basket_pairs:
                        basket_pairs[pair_key] = {
                            "product1_id": p1.id,
                            "product1_name": p1.name,
                            "product2_id": p2.id,
                            "product2_name": p2.name,
                            "frequency": 0
                        }
                    basket_pairs[pair_key]["frequency"] += 1
    
    # Sort by frequency and get top 10
    basket_analysis = sorted(basket_pairs.values(), key=lambda x: x["frequency"], reverse=True)[:10]
    
    return Response({
        "product_performance": product_performance,
        "basket_analysis": basket_analysis
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_traffic(request):
    """
    Tab 4: Traffic & Customer Analysis
    Returns traffic sources, search keywords, and customer segmentation
    """
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    # Get time period
    period = request.GET.get("period", "30days")
    now = timezone.now()
    
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7days":
        start_date = now - timedelta(days=7)
    elif period == "30days":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=30)
    
    end_date = now
    
    # Get seller's data
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    
    orders = Order.objects.filter(
        id__in=order_ids,
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    # Traffic sources (mock data - in real app, track with UTM parameters)
    total_visits = orders.count() * 10  # Estimate
    traffic_sources = [
        {"source": "Tìm kiếm trên sàn", "visits": int(total_visits * 0.4), "percentage": 40},
        {"source": "Khám phá (trang chủ)", "visits": int(total_visits * 0.3), "percentage": 30},
        {"source": "Quảng cáo nội sàn", "visits": int(total_visits * 0.2), "percentage": 20},
        {"source": "Nguồn bên ngoài", "visits": int(total_visits * 0.1), "percentage": 10}
    ]
    
    # Top search keywords (mock data - extract from product names)
    products = Product.objects.filter(seller=seller)
    keywords = []
    for product in products:
        # Split product name into words
        words = product.name.lower().split()
        for word in words:
            if len(word) > 3:  # Only meaningful words
                keywords.append(word)
    
    # Count keyword frequency
    from collections import Counter
    keyword_counts = Counter(keywords)
    top_keywords = [
        {"keyword": keyword, "count": count}
        for keyword, count in keyword_counts.most_common(10)
    ]
    
    # Customer analysis - new vs returning
    # Get unique customers
    customer_ids = orders.values_list("user_id", flat=True).distinct()
    total_customers = len(customer_ids)
    
    # Count orders per customer
    returning_customers = 0
    for customer_id in customer_ids:
        customer_orders = Order.objects.filter(
            user_id=customer_id,
            id__in=order_ids
        ).count()
        if customer_orders > 1:
            returning_customers += 1
    
    new_customers = total_customers - returning_customers
    retention_rate = round((returning_customers / total_customers * 100) if total_customers > 0 else 0, 2)
    
    customer_analysis = {
        "total_customers": total_customers,
        "new_customers": new_customers,
        "returning_customers": returning_customers,
        "retention_rate": retention_rate,
        "new_percentage": round((new_customers / total_customers * 100) if total_customers > 0 else 0, 2),
        "returning_percentage": round((returning_customers / total_customers * 100) if total_customers > 0 else 0, 2)
    }
    
    return Response({
        "traffic_sources": traffic_sources,
        "top_keywords": top_keywords,
        "customer_analysis": customer_analysis
    })