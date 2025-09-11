from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F, Count
from django.utils.timezone import now
from datetime import timedelta

from users.models import CustomUser
from products.models import Product
from orders.models import Order, OrderItem

from .serializers import DashboardSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    total_users = CustomUser.objects.count()
    total_sellers = Seller.objects.count()
    total_customers = CustomUser.objects.filter(role__name="customer").count()
    total_products = Product.objects.count()
    total_orders = Order.objects.count()
    total_revenue = Order.objects.aggregate(total=Sum("total_price"))["total"] or 0

    # --- Top sản phẩm ---
    top_products = list(
        OrderItem.objects.values(
        prod_id=F("product__id"),   # Đổi từ pro_id -> prod_id
        name=F("product__name")
    )
    .annotate(sales=Sum("quantity"))
    .order_by("-sales")[:5]
)


    # --- Top seller ---
    top_sellers = list(
        OrderItem.objects
        .filter(product__seller__isnull=False)
        .values(
            seller_id=F("product__seller__id"),
            store_name=F("product__seller__store_name")
        )
        .annotate(revenue=Sum(F("quantity") * F("price")))
        .order_by("-revenue")[:5]
    )

    # --- Doanh thu 12 tháng ---
    revenue_by_month = []
    today = now()
    for i in range(11, -1, -1):
        month_date = today - timedelta(days=30 * i)
        month = month_date.strftime("%b")
        revenue = (
            Order.objects.filter(
                created_at__year=month_date.year,
                created_at__month=month_date.month
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
        "top_products": top_products,
        "top_sellers": top_sellers,
        "revenue_by_month": revenue_by_month,
        "orders_by_status": orders_by_status,
    }

    serializer = DashboardSerializer(data)  # ✅ Truyền instance, không phải data=
    return Response(serializer.data)

    # --- Tổng số ---
    total_users = CustomUser.objects.count()
    total_sellers = CustomUser.objects.filter(role="seller").count()  # ✅ đếm theo role
    total_customers = CustomUser.objects.filter(is_customer=True).count()
    total_products = Product.objects.count()
    total_orders = Order.objects.count()
    total_revenue = Order.objects.aggregate(total=Sum("total_price"))["total"] or 0

    # --- Top sản phẩm ---
    top_products = list(
        OrderItem.objects.values(
            product_id=F("product__id"),
            name=F("product__name")
        )
        .annotate(sales=Sum("quantity"))
        .order_by("-sales")[:5]
    )

    # --- Top seller ---
    top_sellers = list(
    OrderItem.objects
    .filter(product__seller__isnull=False)
    .values(
        seller_id=F("product__seller__id"),
        store_name=F("product__seller__store_name")
    )
    .annotate(revenue=Sum(F("quantity") * F("price")))
    .order_by("-revenue")[:5]
)


    # --- Doanh thu 12 tháng ---
    revenue_by_month = []
    today = now()
    for i in range(11, -1, -1):
        month_date = today - timedelta(days=30 * i)
        month = month_date.strftime("%b")
        revenue = (
            Order.objects.filter(
                created_at__year=month_date.year,
                created_at__month=month_date.month
            ).aggregate(total=Sum("total_price"))["total"]
            or 0
        )
        revenue_by_month.append({"month": month, "revenue": float(revenue)})

    # --- Orders by status ---
    orders_by_status = list(
        Order.objects.values(status=F("status"))
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
        "top_products": top_products,
        "top_sellers": top_sellers,
        "revenue_by_month": revenue_by_month,
        "orders_by_status": orders_by_status,
    }

    serializer = DashboardSerializer(data)
    return Response(serializer.data)