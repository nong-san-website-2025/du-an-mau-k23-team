from django.contrib import admin
from .models import UserCustomer

@admin.register(UserCustomer)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_seller', 'is_staff', 'is_active')
    search_fields = ('username', 'email')
    list_filter = ('is_seller', 'is_staff', 'is_active')