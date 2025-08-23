from rest_framework import serializers
from .models import Review
from rest_framework import generics, permissions


class ReviewSerializer(serializers.ModelSerializer):

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