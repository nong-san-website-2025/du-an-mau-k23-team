from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.generic import TemplateView
from dashboard.views import dashboard_data

from promotions.urls import router as promotions_router
# ✅ import views của SimpleJWT
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Import SSE view
from users.views.notifications import notification_sse_view

def home(request):
    return HttpResponse("Hello, world!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home),

    path('api/users/', include('users.urls')),
    path('api/sellers/', include('sellers.urls')),
    path('api/products/', include('products.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),    
    path('api/', include('wallet.urls')),
    path('api/', include('cart.urls')),
    path('api/store/', include('store.urls')),
    path('api/cart/', include('cart.urls')),
    path('', include('reviews.urls')),
    path("api/promotions/", include("promotions.urls")),
    path("api/promotions/", include(promotions_router.urls)),
    path('api/search/', include('search.urls')),

    path('api/complaints/', include('complaints.urls')),

    path('api/delivery/', include('delivery.urls')),

    path("api/dashboard/", dashboard_data, name="dashboard-data"),
    path("api/dashboard/", include("dashboard.urls")),

    # ✅ thêm endpoint login bằng JWT
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # path("api/dashboard/", include("dashboard.urls")),

    path("api/marketing/", include("marketing.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/", include("blog.urls")),

    # SSE endpoint
    path('api/sse/', notification_sse_view, name='sse-notifications'),

    path("api/", include("system.urls")),
    path('api/', include('system_settings.urls')),

    
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

