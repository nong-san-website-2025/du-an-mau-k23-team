from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.generic import TemplateView
from dashboard.views import dashboard_data

# ✅ import views của SimpleJWT
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

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
    path('api/blog/', include('blog.urls')),
    path('api/store/', include('store.urls')),
    path('api/cart/', include('cart.urls')),

    path('api/advertisements/', include('advertisements.urls')),
    path('', include('reviews.urls')),
    path("api/promotions/", include("promotions.urls")),

    path('api/complaints/', include('complaints.urls')),
    path("api/dashboard/", dashboard_data, name="dashboard-data"),
    path("api/dashboard/", include("dashboard.urls")),

    # ✅ thêm endpoint login bằng JWT
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # path("api/dashboard/", include("dashboard.urls")),

    path("api/marketing/", include("marketing.urls")),


    path("api/", include("system.urls")),

    


    # path('api/system-logs/', include('system_logs.urls')),

]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all for React routes: any non-API path serves index.html
urlpatterns += [
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name="index.html")),
]
