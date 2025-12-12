from django.http import FileResponse
import os
from django.conf import settings
from rest_framework import generics
from .models import Store
from .serializers import StoreSerializer

class StoreListView(generics.ListAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

def placeholder_svg(request):
    svg_path = os.path.join(settings.MEDIA_ROOT, 'assets', 'placeholder.svg')
    return FileResponse(open(svg_path, 'rb'), content_type='image/svg+xml')
