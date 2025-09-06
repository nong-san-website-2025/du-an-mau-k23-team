from rest_framework import viewsets, permissions, generics
from rest_framework.exceptions import NotFound
from .models import Review, ReviewReply, CustomerSupport
from .serializers import ReviewSerializer, ReviewReplySerializer, CustomerSupportSerializer


# ----------------- REVIEW -----------------
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


# ----------------- REVIEW REPLY -----------------
class ReviewReplyViewSet(viewsets.ModelViewSet):
    queryset = ReviewReply.objects.all()
    serializer_class = ReviewReplySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ----------------- CUSTOMER SUPPORT -----------------
class CustomerSupportViewSet(viewsets.ModelViewSet):
    queryset = CustomerSupport.objects.all()
    serializer_class = CustomerSupportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # chỉ trả về khiếu nại/phản hồi của user hiện tại
        return CustomerSupport.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
