
from rest_framework import serializers
from .models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import AbstractUser
from django.db import models
from .models import Address

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id", "username", "email", "is_seller", "avatar",
            "full_name", "phone", "address"
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    is_seller = serializers.BooleanField(default=False)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2', 'is_seller')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Mật khẩu nhập lại không khớp.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        is_seller = validated_data.pop('is_seller', False)
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.is_seller = is_seller
        user.save()
        return user

# ForgotPasswordSerializer nên được định nghĩa ngoài class RegisterSerializer
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = "__all__"
        read_only_fields = ["user"]