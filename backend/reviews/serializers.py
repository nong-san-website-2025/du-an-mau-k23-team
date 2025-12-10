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
        return ReviewReplySerializer(obj.replies.all(), many=True, context=self.context).data

    def validate(self, data):
        request = self.context.get("request")
        if request and request.user:
            user = request.user
            product = data.get("product")
            if product and Review.objects.filter(user=user, product=product).exists():
                raise serializers.ValidationError("Bạn đã đánh giá sản phẩm này rồi.")
        return data


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        # Exclude hidden reviews for public viewing
        return Review.objects.filter(product_id=product_id, is_hidden=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs["product_id"])

# ----------------- REVIEW REPLY -----------------
class ReviewReplySerializer(serializers.ModelSerializer):
    review = serializers.PrimaryKeyRelatedField(queryset=Review.objects.all())    
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewReply
        fields = "__all__"
        read_only_fields = ["user"]

    def get_user_name(self, obj):
        try:
            # Prefer full name when available
            return getattr(obj.user, 'get_full_name', lambda: None)() or getattr(obj.user, 'username', None) or str(obj.user)
        except Exception:
            return None


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
