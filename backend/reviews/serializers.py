from rest_framework import serializers
from .models import Review, ReviewReply, CustomerSupport
from rest_framework import generics, permissions


# ----------------- REVIEW -----------------
class ReviewSerializer(serializers.ModelSerializer):
    user_avatar = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    seller_store_name = serializers.CharField(source="product.seller.store_name", read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ["user"]

    def get_user_avatar(self, obj):
        # Nếu user có profile với avatar
        if hasattr(obj.user, "profile") and getattr(obj.user.profile, "avatar", None):
            try:
                return obj.user.profile.avatar.url
            except Exception:
                pass
        return "/media/default-avatar.png"

    def get_user_name(self, obj):
        full_name = getattr(obj.user, "get_full_name", lambda: "")()
        return full_name or getattr(obj.user, "username", "")

    def get_replies(self, obj):
        # Trả về danh sách reply của review
        return ReviewReplySerializer(obj.replies.all(), many=True).data

    def validate(self, data):
        # Chỉ dùng khi tạo review theo route products/<product_id>/reviews/
        view = self.context.get("view")
        request = self.context.get("request")
        if request and view:
            user = request.user
            product_id = view.kwargs.get("product_id")
            if product_id and Review.objects.filter(user=user, product_id=product_id).exists():
                raise serializers.ValidationError("Bạn đã đánh giá sản phẩm này rồi.")
        return data


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return Review.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs["product_id"])


# ----------------- REVIEW REPLY -----------------
class ReviewReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewReply
        fields = "__all__"
        read_only_fields = ["user"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["user"] = request.user
        return super().create(validated_data)


# ----------------- CUSTOMER SUPPORT -----------------
class CustomerSupportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerSupport
        fields = "__all__"
        read_only_fields = ["user", "is_resolved"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["user"] = request.user
        return super().create(validated_data)
