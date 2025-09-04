from rest_framework import serializers
from .models import Review, ReviewReply, CustomerSupport
from rest_framework import generics, permissions


# ----------------- REVIEW -----------------
class ReviewSerializer(serializers.ModelSerializer):
    user_avatar = serializers.SerializerMethodField()  # thêm field avatar

    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ["user"]

    def get_user_avatar(self, obj):
        # Nếu user có profile với avatar
        if hasattr(obj.user, "profile") and obj.user.profile.avatar:
            return obj.user.profile.avatar.url
        return "/media/default-avatar.png"

    def validate(self, data):
        request = self.context["request"]
        user = request.user
        product_id = self.context["view"].kwargs.get("product_id")

        # Nếu user đã đánh giá sản phẩm này rồi thì chặn
        if Review.objects.filter(user=user, product_id=product_id).exists():
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
