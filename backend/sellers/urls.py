from django.urls import path
from .views import (
    SellerListAPIView,
    SellerDetailAPIView,
    SellerRegisterAPIView,
    SellerPendingListAPIView,
    SellerApproveAPIView,
    SellerRejectAPIView,
    SellerViewSet,
)
from rest_framework.routers import DefaultRouter
from .views import (
    SellerViewSet,
    ShopViewSet,
    ProductViewSet,
    SellerLockAPIView,
    SellerByStatusAPIView,
    SellerProductsAPIView,
    SellerMeAPIView,
    SellerActivateAPIView
)
from sellers import views

router = DefaultRouter()
router.register(r'sellers', SellerViewSet, basename="sellers")
router.register(r'shops', ShopViewSet, basename="shops")
router.register(r"products", ProductViewSet)

urlpatterns = [
    path('', SellerListAPIView.as_view(), name='seller-list'),  # api/sellers/
    path('register/', SellerRegisterAPIView.as_view(), name='seller-register'),  # api/sellers/register/
    path('pending/', SellerPendingListAPIView.as_view(), name='seller-pending'),  # api/sellers/pending/
    path('<int:pk>/approve/', SellerApproveAPIView.as_view(), name='seller-approve'),  # api/sellers/<id>/approve/
    path('<int:pk>/reject/', SellerRejectAPIView.as_view(), name='seller-reject'),  # api/sellers/<id>/reject/
    path("<int:pk>/lock/", SellerLockAPIView.as_view(), name="seller-lock"),
    path("group/<str:group>/", SellerByStatusAPIView.as_view()),
    path('me/', SellerMeAPIView.as_view(), name='seller-me'),  # api/sellers/me/
    path('<int:pk>/', SellerDetailAPIView.as_view(), name='seller-detail'),  # api/sellers/1/
    path('productseller/', SellerProductsAPIView.as_view()),
    path("search/", views.search_sellers, name="search-sellers"),
    path('activate/', SellerActivateAPIView.as_view(), name='seller-activate'),
] + router.urls
