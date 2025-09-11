from rest_framework import viewsets, permissions, generics
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from django.db.models import Avg, Count
from django.utils import timezone
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


class SellerReviewsView(generics.ListAPIView):
    """
    Danh sách đánh giá cho các sản phẩm thuộc cửa hàng của người bán hiện tại.
    Hỗ trợ filter theo product_id, seller_id, store_name.
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Review.objects.select_related("product", "product__seller", "user").all()
        user = self.request.user
        # Nếu là seller, chỉ xem review của sản phẩm của mình
        seller = getattr(user, "seller", None)
        if seller:
            qs = qs.filter(product__seller=seller)
        # Filter bổ sung
        product_id = self.request.query_params.get("product_id")
        seller_id = self.request.query_params.get("seller_id")
        store_name = self.request.query_params.get("store_name")
        if product_id:
            qs = qs.filter(product_id=product_id)
        if seller_id:
            qs = qs.filter(product__seller_id=seller_id)
        if store_name:
            qs = qs.filter(product__seller__store_name__icontains=store_name)
        return qs.order_by("-created_at")


class SellerReviewsSummaryView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        seller = getattr(user, "seller", None)
        qs = Review.objects.select_related("product", "product__seller").all()
        if seller:
            qs = qs.filter(product__seller=seller)

        total_reviews = qs.count()
        average_rating = qs.aggregate(avg=Avg("rating")).get("avg") or 0
        pending_replies = qs.annotate(rc=Count("replies")).filter(rc=0).count()

        now = timezone.now()
        year = int(request.query_params.get("year", now.year))
        month = request.query_params.get("month")
        monthly_qs = qs.filter(created_at__year=year)
        if month:
            monthly_qs = monthly_qs.filter(created_at__month=month)

        stars_distribution = {str(i): 0 for i in range(1, 6)}
        for row in monthly_qs.values("rating").annotate(c=Count("id")):
            stars_distribution[str(row["rating"])] = row["c"]

        data = {
            "totalReviews": total_reviews,
            "averageRating": round(float(average_rating), 2) if average_rating else 0,
            "pendingReplies": pending_replies,
            "starsDistribution": stars_distribution,
            "year": year,
            "month": int(month) if month else None,
        }
        return Response(data)


class SellerRecentActivitiesView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        seller = getattr(user, "seller", None)
        limit = int(request.query_params.get("limit", 5))

        # Base filters by seller's products
        review_qs = Review.objects.select_related("product", "user", "product__seller")
        reply_qs = ReviewReply.objects.select_related("review", "review__product", "user", "review__product__seller")
        support_qs = CustomerSupport.objects.select_related("product", "user")

        if seller:
            review_qs = review_qs.filter(product__seller=seller)
            reply_qs = reply_qs.filter(review__product__seller=seller)
            support_qs = support_qs.filter(product__seller=seller)

        activities = []

        for r in review_qs.order_by("-created_at")[:limit * 2]:
            activities.append({
                "type": "review_created",
                "id": r.id,
                "created_at": r.created_at,
                "user": getattr(r.user, "username", None),
                "product": getattr(r.product, "name", None),
                "rating": r.rating,
                "message": f"{getattr(r.user, 'username', 'Người dùng')} đã đánh giá {r.rating}/5 cho {getattr(r.product, 'name', '')}",
            })

        for rp in reply_qs.order_by("-created_at")[:limit * 2]:
            activities.append({
                "type": "review_replied",
                "id": rp.id,
                "created_at": rp.created_at,
                "user": getattr(rp.user, "username", None),
                "product": getattr(rp.review.product, "name", None),
                "message": f"{getattr(rp.user, 'username', 'Bạn')} đã trả lời 1 đánh giá về {getattr(rp.review.product, 'name', '')}",
            })

        for sp in support_qs.order_by("-created_at")[:limit * 2]:
            activities.append({
                "type": "support_created",
                "id": sp.id,
                "created_at": sp.created_at,
                "user": getattr(sp.user, "username", None),
                "product": getattr(sp.product, "name", None),
                "message": f"{getattr(sp.user, 'username', 'Người dùng')} đã gửi {sp.issue_type} cho {getattr(sp.product, 'name', '')}",
            })

        # Sort all by created_at desc and take top N
        activities.sort(key=lambda x: x["created_at"], reverse=True)
        activities = activities[:limit]

        # Serialize timestamps to ISO
        for a in activities:
            a["created_at"] = a["created_at"].isoformat()

        return Response({"results": activities})


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
