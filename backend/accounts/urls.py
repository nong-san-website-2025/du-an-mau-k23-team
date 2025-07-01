from django.urls import path
from .views import RegisterView, CurrentUserView, LoginView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='me'),
     path('login/', LoginView.as_view(), name='login'),
]
