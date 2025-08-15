from django.contrib import admin
from .models import Wallet, WalletTopUpRequest

admin.site.register(Wallet)
admin.site.register(WalletTopUpRequest)
