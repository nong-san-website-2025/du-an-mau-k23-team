from django.contrib import admin
from .models import WalletRequest, UserWallet


@admin.register(WalletRequest)
class WalletRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'status', 'created_at', 'processed_by']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            obj.processed_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserWallet)
class UserWalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']