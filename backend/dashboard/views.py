# dashboard/views.py
# dashboard/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, F
from django.http import JsonResponse
import traceback
from rest_framework.views import APIView

from users.models import CustomUser
from products.models import Product
from orders.models import Order, OrderItem


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    try:
        total_users = CustomUser.objects.count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        total_revenue = (
            Order.objects.aggregate(total=Sum("total_price"))["total"] or 0
        )

        top_products = (
            OrderItem.objects.values(product_name=F("product__name"))
            .annotate(sales=Sum("quantity"))
            .order_by("-sales")[:5]
        )

        return JsonResponse({
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "top_products": list(top_products),
        })

    except Exception as e:
        print("🔥 Dashboard API Error:", str(e))
        traceback.print_exc()  # in traceback chi tiết ra terminal
        return JsonResponse({"error": str(e)}, status=500)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # --- Tổng số người dùng ---
            total_users = CustomUser.objects.count()

            # --- Tổng số sản phẩm ---
            total_products = Product.objects.count()

            # --- Tổng số đơn hàng ---
            total_orders = Order.objects.count()

            # --- Tổng doanh thu ---
            total_revenue = Order.objects.aggregate(total=Sum("total_price"))["total"] or 0

            # --- Người bán đang hoạt động (role__name = seller) ---
            active_sellers = CustomUser.objects.filter(
                role__name="seller", is_active=True
            ).count()

            # --- Top 5 sản phẩm bán chạy ---
            top_products = (
                OrderItem.objects.values(product_name=F("product__name"))
                .annotate(sales=Sum("quantity"))
                .order_by("-sales")[:5]
            )

            data = {
                "total_users": total_users,
                "total_products": total_products,
                "total_orders": total_orders,
                "total_revenue": float(total_revenue),
                "active_sellers": active_sellers,
                "top_products": list(top_products),
            }
            return Response(data)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
