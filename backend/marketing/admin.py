# apps/marketing/admin.py
from django.contrib import admin
from .models import Banner, AdSlot

admin.site.register(Banner)
admin.site.register(AdSlot)

