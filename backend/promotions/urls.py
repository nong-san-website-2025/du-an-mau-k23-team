from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views # Import module views để lấy voucher_usage_history
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
    ImportVoucherAPIView, # Đảm bảo import này đã có
    voucher_usage_by_voucher,
)


router = DefaultRouter()
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'flashsale-admin', FlashSaleAdminViewSet, basename='flashsale-admin')
router.register(r'seller/vouchers', SellerVoucherViewSet, basename='seller-voucher')

urlpatterns = [
    # Import Excel
    path('vouchers/import_excel/', ImportVoucherAPIView.as_view(), name='voucher-import-excel'),

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

    # MỚI: Usage History (Lấy từ module views đã import ở trên)
    path('usage-history/', views.voucher_usage_history, name='voucher-usage-history'),
    path('vouchers/<int:voucher_id>/usage/', voucher_usage_by_voucher, name='voucher-usage-by-voucher'),
]

urlpatterns += router.urls