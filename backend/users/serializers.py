import re
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
    # Include full addresses list for admin views
    addresses = serializers.SerializerMethodField()

    # Wallet balance present on CustomUser model
    wallet_balance = serializers.SerializerMethodField()

    # Expose Django's date_joined as created_at for frontend compatibility
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)

    # ✅ BỎ write_only=True để có thể đọc được email/phone
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    avatar = serializers.ImageField(required=False, allow_null=True)
    can_delete = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()
    tier_name = serializers.SerializerMethodField()
    tier_color = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id", "username", "default_address",
            "full_name", "points", "role", "role_id", "created_at", "can_delete", "is_active",
            "wallet_balance", "addresses",
            "email", "phone", "avatar", "orders_count", "total_spent", "tier", "tier_name", "tier_color"
        ]

    def get_default_address(self, obj):
        default = obj.addresses.filter(is_default=True).first()
        return default.location if default else None

    def get_addresses(self, obj):
        # Return serialized addresses for this user (only for admin/detail views)
        try:
            AddressSerializer = globals().get('AddressSerializer')
            if AddressSerializer:
                return AddressSerializer(obj.addresses.all(), many=True).data
            # Fallback: simple dict list
            return [
                {
                    'id': a.id,
                    'recipient_name': a.recipient_name,
                    'phone': a.phone,
                    'location': a.location,
                    'is_default': a.is_default,
                }
                for a in obj.addresses.all()
            ]
        except Exception:
            return []

    def get_wallet_balance(self, obj):
        try:
            # CustomUser has wallet_balance field
            return float(obj.wallet_balance or 0)
        except Exception:
            return 0.0

    def get_history(self, obj):
        histories = obj.point_histories.order_by('-date')
        return UserPointsHistorySerializer(histories, many=True).data

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

    def get_orders_count(self, obj):
        try:
            return obj.orders.count()
        except Exception as e:
            print("[DEBUG] get_orders_count error:", e)
            return 0

    def get_total_spent(self, obj):
        try:
            return float(obj.total_spent or 0)
        except Exception as e:
            print("[DEBUG] get_total_spent error:", e)
            return 0.0

    def get_tier_name(self, obj):
        try:
            from .utils import calculate_user_tier
            _, tier_name, _ = calculate_user_tier(obj.total_spent)
            return tier_name
        except Exception as e:
            print("[DEBUG] get_tier_name error:", e)
            return "Thành viên"

    def get_tier_color(self, obj):
        try:
            from .utils import calculate_user_tier
            _, _, tier_color = calculate_user_tier(obj.total_spent)
            return tier_color
        except Exception as e:
            print("[DEBUG] get_tier_color error:", e)
            return "default"

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

        # Xử lý email change với pending verification
        if "email" in validated_data:
            email_val = validated_data.get("email")
            if email_val and email_val != instance.email and '*' not in str(email_val):
                # Không đổi ngay: lưu pending_email để xác nhận qua link
                instance.pending_email = email_val
            validated_data.pop("email", None)
        
        # Xử lý phone change với OTP
        if "phone" in validated_data:
            phone_val = validated_data.get("phone")
            if phone_val and phone_val != instance.phone and '*' not in str(phone_val):
                # Không đổi ngay: tạo OTP và lưu pending_phone
                instance.pending_phone = phone_val
            validated_data.pop("phone", None)

        # Cập nhật các trường còn lại (full_name, avatar, ...)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

    def to_representation(self, instance):
        """
        Return all fields including real email/phone for all users
        """
        data = super().to_representation(instance)
        
        # ✅ Luôn trả về email/phone thật, không mask
        # Không cần logic kiểm tra quyền
        
        return data

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

        # Kiểm tra độ dài tối thiểu
        if len(data['password']) < 8:
            raise serializers.ValidationError({"password": "Mật khẩu phải có ít nhất 8 ký tự."})

        # Kiểm tra ít nhất 1 ký tự in hoa
        if not re.search(r'[A-Z]', data['password']):
            raise serializers.ValidationError({"password": "Mật khẩu phải chứa ít nhất 1 ký tự in hoa."})

        # Kiểm tra ít nhất 1 số
        if not re.search(r'\d', data['password']):
            raise serializers.ValidationError({"password": "Mật khẩu phải chứa ít nhất 1 số."})

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
    
# serializers.py
from rest_framework import serializers
from .models import Address

class AddressSerializer(serializers.ModelSerializer):
    province_id = serializers.IntegerField(required=True)
    province_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    district_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ward_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Address
        fields = "__all__"
        read_only_fields = ["user"]

    def validate(self, data):
        """
        Validate dữ liệu khi tạo địa chỉ mới
        """
        province_id = data.get('province_id')
        district_id = data.get('district_id')
        ward_code = data.get('ward_code')

        # Nếu có GHN shipping thì 3 trường này bắt buộc
        if province_id is None or district_id is None or ward_code is None:
            raise serializers.ValidationError(
                "Cần cung cấp province_id, district_id và ward_code từ GHN khi tính phí vận chuyển."
            )
        return data

    def create(self, validated_data):
        """
        Gắn user hiện tại khi tạo địa chỉ mới
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)

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
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True, required=False)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    pending_email = serializers.EmailField(read_only=True, allow_null=True)
    pending_phone = serializers.CharField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'role_id', "phone", "avatar", "full_name", "status", "pending_email", "pending_phone", "created_at"]

    def update(self, instance, validated_data):
        import random
        from django.utils import timezone

        # Xử lý email change với pending verification
        if "email" in validated_data:
            email_val = validated_data.get("email")
            if email_val and email_val != instance.email and '*' not in str(email_val):
                instance.pending_email = email_val
                validated_data.pop("email", None)

        # Xử lý phone change với OTP
        if "phone" in validated_data:
            phone_val = validated_data.get("phone")
            if phone_val and phone_val != (instance.phone or "") and '*' not in str(phone_val):
                instance.pending_phone = phone_val
                otp = f"{random.randint(0, 999999):06d}"
                instance.phone_otp = otp
                instance.phone_otp_expires = timezone.now() + timezone.timedelta(minutes=10)
                validated_data.pop("phone", None)

        # Cập nhật các trường còn lại
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class EmployeeSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source='role', write_only=True, required=False)

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


class UserWalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = apps.get_model('users', 'UserWalletTransaction')
        fields = [
            'id', 'amount', 'transaction_type', 'description', 
            'reference_id', 'balance_before', 'balance_after', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    class Meta:
        model = apps.get_model('users', 'Notification')
        fields = ['id', 'type', 'title', 'message', 'detail', 'metadata', 'is_read', 'created_at', 'read_at']
        read_only_fields = ['id', 'created_at']
