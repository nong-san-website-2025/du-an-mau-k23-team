from django.contrib import admin
from .models import Category, Post
from .forms import PostForm

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    form = PostForm   # 👉 Gắn custom form
    list_display = ('title', 'author', 'created_at', 'category')
    prepopulated_fields = {"slug": ("title",)}

    class Media:
        css = {
            "all": ("css/custom_admin.css",)  # 👉 load thêm file css nếu muốn
        }
