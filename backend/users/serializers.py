from rest_framework import serializers
from .models import CustomUser, PointHistory
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Address
from .models import Role
from orders.models import Order
from django.apps import apps
CustomUser = apps.get_model('users', 'CustomUser')
Role = apps.get_model('users', 'Role')
Address = apps.get_model('users', 'Address')
PointHistory = apps.get_model('users', 'PointHistory')
Shop = apps.get_model('store', 'Store')
CustomerOrder = apps.get_model('orders', 'Order')  # buyer orders
ShopOrder = apps.get_model('orders', 'Order')
Seller = apps.get_model('sellers', 'Seller')
Product = apps.get_model('products', 'Product')




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
    # Expose Django's date_joined as created_at for frontend compatibility
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)

    
    class Meta:
        model = CustomUser
        fields = [
            "id", "username", "email", "avatar",
            "full_name", "phone", "points", "role", "role_id", "default_address", "password","created_at", "can_delete", "is_active"
        ]

    def get_default_address(self, obj): 
        default = obj.addresses.filter(is_default=True).first()
        return default.location if default else None

    def get_history(self, obj):
        histories = obj.point_histories.order_by('-date')
        return UserPointsHistorySerializer(histories, many=True).data


    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password("123456")  # gán default password nếu không có
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

    can_delete = serializers.SerializerMethodField()

    def get_can_delete(self, obj):
        try:
            from orders.models import Order
            from store.models import Store

            # Check đã phát sinh đơn hàng
            if Order.all_objects.filter(user=obj).exists():
                return False

            # Check đã đăng ký cửa hàng
            if Store.objects.filter(owner=obj).exists():
                return False

            return True
        except Exception as e:
            print("[DEBUG] get_can_delete error:", e)
            return True



class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    role = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2', 'role', 'full_name', 'phone')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        # Kiểm tra password trùng khớp
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Mật khẩu nhập lại không khớp."})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2', None)

        # Kiểm tra user pending trùng username/email
        existing_user = CustomUser.objects.filter(
            username=validated_data['username']
        ).first()
        if existing_user:
            if existing_user.status == "pending":
                return existing_user  # gửi lại email xác thực, không tạo user mới
            else:
                raise serializers.ValidationError({"username": "Tên đăng nhập đã tồn tại."})

        existing_email = CustomUser.objects.filter(email=validated_data['email']).first()
        if existing_email:
            if existing_email.status == "pending":
                return existing_email
            else:
                raise serializers.ValidationError({"email": "Email đã tồn tại."})

        # Nếu frontend không gửi role → mặc định customer
        if 'role' not in validated_data or validated_data['role'] is None:
            customer_role, _ = Role.objects.get_or_create(name="customer")
            validated_data['role'] = customer_role

        # Tạo user pending
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.status = "pending"
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
