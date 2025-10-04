from django.contrib import admin
from .models import CustomUser, Role, Address

admin.site.register(CustomUser)
admin.site.register(Role)
admin.site.register(Address)