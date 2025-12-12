from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import ShippingSetting, ReturnPolicySetting, MarketingAutomationSetting, LoyaltySetting, ThemeSetting
from .serializers import ShippingSettingSerializer, ReturnPolicySettingSerializer, MarketingAutomationSettingSerializer, LoyaltySettingSerializer, ThemeSettingSerializer
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser

class ShippingSettingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        setting, _ = ShippingSetting.objects.get_or_create(id=1)
        serializer = ShippingSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        setting, _ = ShippingSetting.objects.get_or_create(id=1)
        serializer = ShippingSettingSerializer(setting, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReturnPolicySettingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        setting, _ = ReturnPolicySetting.objects.get_or_create(id=1)
        serializer = ReturnPolicySettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        setting, _ = ReturnPolicySetting.objects.get_or_create(id=1)
        serializer = ReturnPolicySettingSerializer(setting, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class MarketingAutomationSettingView(generics.RetrieveUpdateAPIView):
    queryset = MarketingAutomationSetting.objects.all()
    serializer_class = MarketingAutomationSettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, _ = MarketingAutomationSetting.objects.get_or_create(id=1)
        return obj
    

class LoyaltySettingView(generics.RetrieveUpdateAPIView):
    queryset = LoyaltySetting.objects.all()
    serializer_class = LoyaltySettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, _ = LoyaltySetting.objects.get_or_create(id=1)
        return obj
    
class ThemeSettingView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        theme, _ = ThemeSetting.objects.get_or_create(id=1)
        serializer = ThemeSettingSerializer(theme)
        return Response(serializer.data)

    def put(self, request):
        theme, _ = ThemeSetting.objects.get_or_create(id=1)
        serializer = ThemeSettingSerializer(theme, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)