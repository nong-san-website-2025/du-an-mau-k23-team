# system/urls.py
from django.urls import path
from .views import SystemConfigView, SystemLogsView

urlpatterns = [
    path("system-config/", SystemConfigView.as_view(), name="system-config"),
    path("system-logs/", SystemLogsView.as_view(), name="system-logs"),
]
