from django.contrib import admin
from .models import SystemConfig, SystemLog, StaticPage

admin.site.register(SystemConfig)
admin.site.register(SystemLog)

@admin.register(StaticPage)
class StaticPageAdmin(admin.ModelAdmin):
	list_display = ("slug", "title", "section", "updated_at")
	search_fields = ("slug", "title")
	list_filter = ("section",)
