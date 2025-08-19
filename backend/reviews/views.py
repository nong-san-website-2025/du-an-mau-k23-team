from rest_framework import viewsets, permissions
from .models import Review
from .serializers import ReviewSerializer
from rest_framework.exceptions import NotFound
from rest_framework import generics

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MyReviewView(generics.RetrieveAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        product_id = self.kwargs.get("product_id")
        try:
            return Review.objects.get(product_id=product_id, user=self.request.user)
        except Review.DoesNotExist:
            raise NotFound("Bạn chưa đánh giá sản phẩm này.")