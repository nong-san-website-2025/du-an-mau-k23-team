# system/urls.py
from django.urls import path
from .views import (
    SystemConfigView, SystemLogsView,
    StaticPagesView, StaticPageDetailView,
    StaticPageBlocksPublicView, StaticPageBlocksAdminCreateView, StaticPageBlockDetailAdminView
)

urlpatterns = [
    path("system-config/", SystemConfigView.as_view(), name="system-config"),
    path("system-logs/", SystemLogsView.as_view(), name="system-logs"),
    path("pages/", StaticPagesView.as_view(), name="static-pages"),
    path("pages/<slug:slug>/", StaticPageDetailView.as_view(), name="static-page-detail"),
    # Blocks
    path("pages/<slug:slug>/blocks/", StaticPageBlocksPublicView.as_view(), name="static-page-blocks-public"),
    path("pages/<slug:slug>/blocks/create/", StaticPageBlocksAdminCreateView.as_view(), name="static-page-blocks-create"),
    path("pages/blocks/<int:id>/", StaticPageBlockDetailAdminView.as_view(), name="static-page-block-detail"),
]
