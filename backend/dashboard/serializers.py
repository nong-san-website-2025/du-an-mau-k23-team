# dashboard/serializers.py
from rest_framework import serializers

class TopProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    name = serializers.CharField()
    sales = serializers.IntegerField()

class TopSellerSerializer(serializers.Serializer):
    seller_id = serializers.IntegerField()
    store_name = serializers.CharField()
    revenue = serializers.FloatField()

class RevenueByMonthSerializer(serializers.Serializer):
    month = serializers.CharField()
    revenue = serializers.FloatField()

class OrdersByStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    count = serializers.IntegerField()

class DashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_sellers = serializers.IntegerField()
    total_customers = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    top_products = TopProductSerializer(many=True)
    top_sellers = TopSellerSerializer(many=True)
    revenue_by_month = RevenueByMonthSerializer(many=True)
    orders_by_status = OrdersByStatusSerializer(many=True)
