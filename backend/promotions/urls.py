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
    consume_voucher,
    public_seller_vouchers,
<<<<<<< HEAD
    import_flash_sale_excel,
    download_flash_sale_template,
=======
    ImportVoucherAPIView, # <--- [MỚI] Thêm import này
>>>>>>> e21d4717ed9a21d58b67311486d4ccecfa2d3c42
)

# 2. Khởi tạo router MỘT LẦN DUY NHẤT
router = DefaultRouter()

# 3. Đăng ký tất cả các ViewSet vào router
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'flashsale-admin', FlashSaleAdminViewSet, basename='flashsale-admin')
router.register(r'seller/vouchers', SellerVoucherViewSet, basename='seller-voucher')

# 4. Định nghĩa các URL cho các view lẻ (function-based views)
urlpatterns = [
    # --- [QUAN TRỌNG] URL IMPORT EXCEL ---
    # Bạn nên đặt dòng này ở đầu list hoặc trước các path dynamic khác để tối ưu matching
    path('vouchers/import_excel/', ImportVoucherAPIView.as_view(), name='voucher-import-excel'),

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