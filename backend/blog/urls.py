from django.urls import path
from .views import PostList, PostDetail, CategoryPostList

urlpatterns = [
    path('posts/', PostList.as_view(), name='post-list'),
    path('posts/<slug:slug>/', PostDetail.as_view(), name='post-detail'),
    path('category/<slug:slug>/', CategoryPostList.as_view(), name='category-posts'),
]
