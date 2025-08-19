from rest_framework import serializers
from .models import CustomUser, PointHistory
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Address
from .models import Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class UserPointsHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PointHistory
        fields = ["date", "action", "points", "amount", "order_id"]

class UserPointsHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PointHistory
        fields = ["date", "action", "points", "amount", "order_id"]

class UserSerializer(serializers.ModelSerializer):
    history = serializers.SerializerMethodField()
    default_address = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id", "username", "email", "avatar",
            "full_name", "phone", "is_seller",  
            "is_admin", "is_support", "points", 
            "history", "default_address"
        ]

    def get_default_address(self, obj):
        default = obj.addresses.filter(is_default=True).first()
        return default.location if default else None


    def get_history(self, obj):
        histories = obj.point_histories.order_by('-date')
        return UserPointsHistorySerializer(histories, many=True).data


    def create(self, validated_data):
        user = CustomUser(**validated_data)
        user.set_password(validated_data["password"])
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

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


# Serializer cho đổi mật khẩu
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Mật khẩu mới và xác nhận không khớp.")
        return data
    

class CustomUserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'role_id']
