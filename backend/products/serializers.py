
from rest_framework import serializers
from .models import Product, Category, Subcategory

class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image', 'discounted_price', 'is_new', 'is_organic', 'is_best_seller']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class SubcategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Subcategory
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    subcategory = SubcategorySerializer(read_only=True)
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    image = serializers.ImageField(required=False)
    
    # Thêm các field để nhận dữ liệu từ frontend
    category_id = serializers.IntegerField(write_only=True, required=False)
    subcategory_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = '__all__'
        
    def create(self, validated_data):
        print("Starting create method with:", validated_data)
        
        # Xử lý category_id và subcategory_id
        category_id = validated_data.pop('category_id', None)
        subcategory_id = validated_data.pop('subcategory_id', None)
        
        # Nếu có subcategory_id, lấy subcategory và category từ đó
        if subcategory_id:
            # Nếu subcategory_id đã là object Subcategory, không cần query
            if hasattr(subcategory_id, 'id'):
                subcategory = subcategory_id
                validated_data['subcategory'] = subcategory
                validated_data['category'] = subcategory.category
                print(f"Subcategory is already an object: {subcategory.name}, category: {subcategory.category.name}")
            else:
                try:
                    subcategory = Subcategory.objects.get(id=subcategory_id)
                    validated_data['subcategory'] = subcategory
                    validated_data['category'] = subcategory.category
                    print(f"Set subcategory: {subcategory.name}, category: {subcategory.category.name}")
                except Subcategory.DoesNotExist:
                    raise serializers.ValidationError(f"Subcategory với id {subcategory_id} không tồn tại")
        # Nếu chỉ có category_id, chỉ set category
        elif category_id:
            # Nếu category_id đã là object Category, không cần query
            if hasattr(category_id, 'id'):
                category = category_id
                validated_data['category'] = category
                print(f"Category is already an object: {category.name}")
            else:
                try:
                    category = Category.objects.get(id=category_id)
                    validated_data['category'] = category
                    print(f"Set category: {category.name}")
                except Category.DoesNotExist:
                    raise serializers.ValidationError(f"Category với id {category_id} không tồn tại")
        
        # Đảm bảo các field boolean được xử lý đúng
        for field in ['is_new', 'is_organic', 'is_best_seller']:
            if field in validated_data:
                validated_data[field] = bool(validated_data[field])

        print("Final validated_data before create:", validated_data)
        try:
            product = super().create(validated_data)
            print(f"Product created successfully: {product.name}")
            print(f"Product image after save: {product.image}")
            return product
        except Exception as e:
            print(f"Error creating product: {e}")
            raise

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None
