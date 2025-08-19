from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls), 
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
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
