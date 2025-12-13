from django.urls import path
from rest_framework.routers import DefaultRouter

# 1. Gom tất cả import vào một chỗ cho gọn gàng
from .views import (
    VoucherViewSet,
    FlashSaleAdminViewSet,
    SellerVoucherViewSet,
    promotions_overview,
    FlashSaleListView,
    my_vouchers,
    claim_voucher,
    apply_voucher,
    consume_voucher, # Thêm dòng này
    public_seller_vouchers,
    import_flash_sale_excel,
    download_flash_sale_template,
)

# 2. Khởi tạo router MỘT LẦN DUY NHẤT
router = DefaultRouter()

# 3. Đăng ký tất cả các ViewSet vào router
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'flashsale-admin', FlashSaleAdminViewSet, basename='flashsale-admin')
router.register(r'seller/vouchers', SellerVoucherViewSet, basename='seller-voucher')

# 4. Định nghĩa các URL cho các view lẻ (function-based views)
urlpatterns = [
    path('overview/', promotions_overview, name='promotions-overview'),
    path('flash-sales/', FlashSaleListView.as_view(), name='flash-sale-list'),
    path('vouchers/my_vouchers/', my_vouchers, name='my-vouchers'),
    path('vouchers/claim/', claim_voucher, name='claim-voucher'),
    path('vouchers/apply/', apply_voucher, name='apply-voucher'),
    path('vouchers/consume/', consume_voucher, name='consume-voucher'),
    path('vouchers/public/<int:seller_id>/', public_seller_vouchers, name='public-seller-vouchers'),
    path('flash-sale/import/', import_flash_sale_excel, name='flash-sale-import'),
    path('flash-sale/template/', download_flash_sale_template, name='flash-sale-template'),
]

# 5. Gộp các URL của router vào urlpatterns (Cách làm chuẩn của Django)
urlpatterns += router.urls