from django.contrib import admin
from .models import BlogCategory, BlogPost, Comment, Like, Bookmark

# Register your models here.
admin.site.register(BlogCategory)
admin.site.register(BlogPost)   
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(Bookmark)
