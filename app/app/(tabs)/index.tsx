// HomeScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Header from '@/components/Header';
import BannerCarousel from '@/components/Home/BannerCarousel';
import CategoryGrid from '@/components/Home/CategoryGrid';
import ProductList from '@/components/Home/ProductList'; // ✅ import đúng

const products = [
  { id: '1', name: 'Táo Mỹ', price: 120000, image: require('@/assets/images/tao-my.jpg') },
  { id: '2', name: 'Cải xanh', price: 15000, image: require('@/assets/images/cai-xanh.jpg') },
  { id: '3', name: 'Thịt heo', price: 95000, image: require('@/assets/images/thit-heo.png') },
  { id: '4', name: 'Tôm sú', price: 210000, image: require('@/assets/images/tom-su.png') },
];

export default function HomeScreen() {
  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#f9f9f9', paddingTop: 16 }}>
      <Header />

      {/* Dùng ScrollView hoặc View bao ngoài nếu cần cuộn toàn bộ */}
      <View style={{ flex: 1 }}>
        <BannerCarousel />

        {/* Danh mục */}
        {/* <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
            Danh mục nổi bật
          </ThemedText>
          <CategoryGrid scrollEnabled={false} />
        </View> */}

        {/* Tiêu đề + Danh sách sản phẩm */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
            Gợi ý hôm nay
          </ThemedText>
        </View>

        {/* ✅ DÙNG PRODUCTLIST Ở ĐÂY */}
        <ProductList products={products} numColumns={2} />
      </View>
    </ThemedView>
  );
}