from django.contrib import admin
from .models import Review, ReviewReply, CustomerSupport

# Giữ lại cái bạn có
admin.site.register(Review)

# Thêm mới
admin.site.register(ReviewReply)
admin.site.register(CustomerSupport)

