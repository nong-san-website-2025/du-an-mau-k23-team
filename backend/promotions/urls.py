from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views 
from .views import (
    VoucherViewSet,
    FlashSaleAdminViewSet,
    SellerVoucherViewSet,
    promotions_overview,
    FlashSaleListView,
    my_vouchers,
    claim_voucher,
    apply_voucher,
    consume_voucher,
    public_seller_vouchers,
    import_flash_sale_excel,
    download_flash_sale_template,
    ImportVoucherAPIView,
    voucher_usage_by_voucher,
)

router = DefaultRouter()
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'flashsale-admin', FlashSaleAdminViewSet, basename='flashsale-admin')
router.register(r'seller/vouchers', SellerVoucherViewSet, basename='seller-voucher')

urlpatterns = [
    # [QUAN TRỌNG] Đã đổi từ 'import_excel' thành 'import' để khớp với Frontend
    # Dòng này BẮT BUỘC phải nằm trên router.urls (đã đúng)
    path('vouchers/import/', ImportVoucherAPIView.as_view(), name='voucher-import-excel'),

    # API Function Views
    path('overview/', promotions_overview, name='promotions-overview'),
    path('flash-sales/', FlashSaleListView.as_view(), name='flash-sale-list'),
    path('vouchers/my_vouchers/', my_vouchers, name='my-vouchers'),
    path('vouchers/claim/', claim_voucher, name='claim-voucher'),
    path('vouchers/apply/', apply_voucher, name='apply-voucher'),
    path('vouchers/consume/', consume_voucher, name='consume-voucher'),
    path('vouchers/public/<int:seller_id>/', public_seller_vouchers, name='public-seller-vouchers'),
    
    # Flash Sale Import
    path('flash-sale/import/', import_flash_sale_excel, name='flash-sale-import'),
    path('flash-sale/template/', download_flash_sale_template, name='flash-sale-template'),

    # Usage History
    path('usage-history/', views.voucher_usage_history, name='voucher-usage-history'),
    path('vouchers/<int:voucher_id>/usage/', voucher_usage_by_voucher, name='voucher-usage-by-voucher'),
]

# Router luôn nằm cuối cùng
urlpatterns += router.urls