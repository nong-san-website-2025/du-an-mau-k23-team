from django.contrib import admin
from django.urls import path, include
<<<<<<< HEAD
from django.conf import settings
from django.conf.urls.static import static
=======
from django.conf.urls.static import static
from django.conf import settings
>>>>>>> feature/backend_cart_NhatNguyen

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('cart.urls')),  # Đưa cart.urls lên thẳng /api/ để endpoint là /api/cartitems/
    path('api/users/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
<<<<<<< HEAD
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
=======
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
>>>>>>> feature/backend_cart_NhatNguyen
