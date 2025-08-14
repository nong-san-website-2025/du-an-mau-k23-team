from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, VNPayCreatePaymentView
from django.urls import path

router = DefaultRouter()
router.register(r"", PaymentViewSet, basename="payments")

urlpatterns = router.urls + [
    path('vnpay-create/', VNPayCreatePaymentView.as_view(), name='vnpay-create'),
]