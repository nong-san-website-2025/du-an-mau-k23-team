// HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Header from '@/components/Header';
import BannerCarousel from '@/components/Home/BannerCarousel';
import CategoryGrid from '@/components/Home/CategoryGrid';
import ProductList from '@/components/Home/ProductList';
import { productApi } from '@/api/productApi';

type Product = {
  id: string;
  name: string;
  price: number;
  image: any; // Có thể là string URL hoặc require
};

const fallbackProducts: Product[] = [
  { id: '1', name: 'Táo Mỹ', price: 120000, image: require('@/assets/images/fruit.png') },
  { id: '2', name: 'Cải xanh', price: 15000, image: require('@/assets/images/vegetable.png') },
  { id: '3', name: 'Thịt heo', price: 95000, image: require('@/assets/images/meat.png') },
  { id: '4', name: 'Tôm sú', price: 210000, image: require('@/assets/images/seafood.png') },
];

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const data = await productApi.getAllProducts();

      // Giả sử API trả về { results: [...] } hoặc trực tiếp array
      const productList = Array.isArray(data) ? data : data.results || [];

      // Map data từ API thành format phù hợp
      const mappedProducts: Product[] = productList.map((item: any) => ({
        id: item.id?.toString() || item.pk?.toString() || '',
        name: item.name || item.title || '',
        price: parseFloat(item.price) || 0,
        image: typeof item.image === 'string' ? { uri: item.image } : item.image, // Xử lý URL
      }));


      setProducts(mappedProducts.length > 0 ? mappedProducts : fallbackProducts);
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      const errorMessage = error.message || 'Lỗi không xác định';
      Alert.alert('Lỗi kết nối API', `Không thể tải sản phẩm:\n${errorMessage}\n\nSử dụng dữ liệu mẫu.`);
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <Header />

      {/* Dùng ScrollView hoặc View bao ngoài nếu cần cuộn toàn bộ */}
      <View style={{ flex: 1 }}>
        <BannerCarousel />

        {/* Danh mục */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
            Danh mục nổi bật
          </ThemedText>
          <CategoryGrid scrollEnabled={false} />
        </View>

        {/* Tiêu đề + Danh sách sản phẩm */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
            Gợi ý hôm nay
          </ThemedText>
        </View>

        {/* ✅ DÙNG PRODUCTLIST Ở ĐÂY */}
        <ProductList
          products={products}
          numColumns={2}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </View>
    </ThemedView>
  );
}