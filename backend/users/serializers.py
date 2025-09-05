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
    default_address = serializers.SerializerMethodField()
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = [
            "id", "username", "email", "avatar",
            "full_name", "phone", "points", "role", "role_id", "default_address", "password"
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
    
    # Lấy role object nếu có
        role_obj = validated_data.pop("role", None)
        if role_obj is not None:
            instance.role = role_obj

        # Cập nhật các trường còn lại
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    # Hỗ trợ cả 2 cách: role (mới) hoặc is_seller (cũ)
    role = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_seller = serializers.BooleanField(default=False, required=False)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2', 'role', 'is_seller')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Mật khẩu nhập lại không khớp.")
        return data

    def create(self, validated_data):
        from .models import Role as RoleModel
        validated_data.pop('password2')
        password = validated_data.pop('password')

        # Lấy role từ payload nếu có; fallback sang is_seller
        role_str = validated_data.pop('role', None)
        is_seller_flag = validated_data.pop('is_seller', False)

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()  # cần save trước để gán role ForeignKey

        if role_str:
            role_name = str(role_str).strip().lower()
            role_obj, _ = RoleModel.objects.get_or_create(name=role_name)
            user.role = role_obj
            user.save()
        elif is_seller_flag:
            role_obj, _ = RoleModel.objects.get_or_create(name='seller')
            user.role = role_obj
            user.save()
        # nếu không có role và không is_seller: model.save() đã gán mặc định 'customer'

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
        fields = ['id', 'username', 'email', 'role', 'role_id', "phone", "avatar", "full_name", "status"]

class EmployeeSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True)

    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "full_name", "phone", "role", "role_id", "status"]

    def create(self, validated_data):
        # Mặc định tạo nhân viên với role = "employee"
        employee_role = Role.objects.get(name="employee")
        user = CustomUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data.get("password", "123456"),  # default
            full_name=validated_data.get("full_name", ""),
            phone=validated_data.get("phone", ""),
            role=employee_role
        )
        return user
    

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'full_name', 'phone']


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'full_name', 'phone']
