from django.contrib import admin
from .models import Voucher, FlashSale, FlashSaleProduct

# Register your models here.
admin.site.register(Voucher)
admin.site.register(FlashSale)
admin.site.register(FlashSaleProduct)