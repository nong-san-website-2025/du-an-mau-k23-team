# views/dashboard.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.utils.timezone import now
from datetime import timedelta

from users.models import CustomUser
from products.models import Product
from orders.models import Order, OrderItem
from sellers.models import Seller
from complaints.models import Complaint


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    # --- Tổng số ---
    total_users = CustomUser.objects.count()
    total_sellers = Seller.objects.count()
    total_customers = CustomUser.objects.filter(role__name="customer").count()
    total_products = Product.objects.count()
    total_orders = Order.objects.count()

    # ✅ Tổng doanh thu = chỉ tính đơn thành công
    total_revenue = (
        Order.objects.filter(status__in=["success", "delivered"])
        .aggregate(total=Sum("total_price"))["total"] or 0
    )

    today = now().date()

    # --- KPI bổ sung ---
    new_orders_today = Order.objects.filter(created_at__date=today).count()

    # đang xử lý = pending + shipping + ready_to_pick + picking
    processing_orders = Order.objects.filter(
        status__in=["pending", "shipping", "ready_to_pick", "picking"]
    ).count()

    new_complaints = Complaint.objects.filter(created_at__date=today).count()
    new_users_today = CustomUser.objects.filter(date_joined__date=today).count()

    cancelled_orders = Order.objects.filter(status="cancelled").count()
    cancel_rate = round((cancelled_orders / total_orders * 100), 2) if total_orders > 0 else 0

    # --- Top sản phẩm ---
    top_products = (
        OrderItem.objects.values(prod_id=F("product__id"), name=F("product__name"))
        .annotate(sales=Sum("quantity"))
        .order_by("-sales")[:5]
    )

    # --- Top seller ---
    top_sellers = (
        OrderItem.objects.filter(product__seller__isnull=False)
        .values(seller_id=F("product__seller__id"), store_name=F("product__seller__store_name"))
        .annotate(revenue=Sum(F("quantity") * F("price")))
        .order_by("-revenue")[:5]
    )

    # --- Doanh thu 12 tháng ---
    revenue_by_month = []
    today_dt = now()
    for i in range(11, -1, -1):
        month_date = today_dt - timedelta(days=30 * i)
        month = month_date.strftime("%b")
        revenue = (
            Order.objects.filter(
                status__in=["success", "delivered"],  # chỉ tính thành công
                created_at__year=month_date.year,
                created_at__month=month_date.month,
            ).aggregate(total=Sum("total_price"))["total"]
            or 0
        )
        revenue_by_month.append({"month": month, "revenue": float(revenue)})

    # --- Orders by status ---
    orders_by_status = (
        Order.objects.values(sta=F("status"))
        .annotate(count=Count("id"))
        .order_by("status")
    )

    data = {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "total_customers": total_customers,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "new_orders_today": new_orders_today,
        "processing_orders": processing_orders,
        "new_complaints": new_complaints,
        "new_users_today": new_users_today,
        "cancel_rate": cancel_rate,
        "top_products": list(top_products),
        "top_sellers": list(top_sellers),
        "revenue_by_month": revenue_by_month,
        "orders_by_status": list(orders_by_status),
    }

    return Response(data)
