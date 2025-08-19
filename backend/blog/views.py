from rest_framework import generics, filters
from .models import Post, Category
from .serializers import PostSerializer, CategorySerializer

class PostList(generics.ListAPIView):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']

class PostDetail(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    lookup_field = 'slug'

class CategoryPostList(generics.ListAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        slug = self.kwargs['slug']
        return Post.objects.filter(category__slug=slug).order_by('-created_at')