from rest_framework import serializers
from .models import Complaint, ComplaintMedia

class ComplaintMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintMedia
        fields = ['file']

class ComplaintSerializer(serializers.ModelSerializer):
    # Lấy tên người khiếu nại từ CustomUser
    complainant_name = serializers.SerializerMethodField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    order_id = serializers.SerializerMethodField()
    product_price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2, read_only=True
    )
    discounted_price = serializers.SerializerMethodField()
    media_urls = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "id",
            "complainant_name",   # 👈 tên người khiếu nại
            "product_id",
            "product_name",
            "order_id",
            "reason",
            "status",
            "quantity",
            "unit_price",
            "product_price",
            "discounted_price",
            "media_urls",
            "created_at",
            "resolution_type",
        ]
        read_only_fields = ["user"]

    def get_complainant_name(self, obj):
        """Lấy tên người khiếu nại từ user"""
        if obj.user:
            return obj.user.full_name or obj.user.username
        return None

    def get_order_id(self, obj):
        """Tìm đơn hàng liên quan đến product"""
        order_items = getattr(obj.product, "order_items", None)
        if order_items and order_items.exists():
            return order_items.first().order.id
        return None

    def get_discounted_price(self, obj):
        product = getattr(obj, "product", None)
        if product and hasattr(product, "discounted_price"):
            return product.discounted_price
        return None

    def get_media_urls(self, obj):
        return [m.file.url for m in obj.media.all()]
class ComplaintDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    order_id = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()   # 👈 thêm dòng này
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    discounted_price = serializers.SerializerMethodField()
    media_urls = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "id", "user_name", "customer_name",  # 👈 đảm bảo có ở đây
            "product_id", "product_name", "order_id",
            "reason", "status", "quantity", "unit_price",
            "product_price", "discounted_price", "media_urls",
            "created_at", "resolution_type",
        ]
        read_only_fields = ["user"]

    def get_order_id(self, obj):
        order_item = getattr(obj.product, "order_items", None)
        if order_item and order_item.exists():
            return order_item.first().order.id
        return None

    def get_customer_name(self, obj):
        """
        Lấy tên khách hàng đã đặt hàng sản phẩm trong đơn hàng
        """
        order_item = getattr(obj.product, "order_items", None)
        if order_item and order_item.exists():
            order = order_item.first().order
            return getattr(order.user, "full_name", order.user.username)  # lấy full_name nếu có
        return None

    def get_discounted_price(self, obj):
        product = getattr(obj, 'product', None)
        if product and hasattr(product, 'discounted_price'):
            return product.discounted_price
        return None

    def get_media_urls(self, obj):
        return [m.file.url for m in obj.media.all()]
