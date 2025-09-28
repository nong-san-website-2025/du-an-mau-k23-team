// ProductList.tsx
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ProductCard from '@/components/Home/ProductCard'; // ✅ Đảm bảo đường dẫn đúng

type Product = {
  id: string;
  name: string;
  price: number;
  image: any;
};

type ProductListProps = {
  products: Product[];
  numColumns?: number; // mặc định 2
  onRefresh?: () => void;
  refreshing?: boolean;
};

export default function ProductList({
  products,
  numColumns = 2,
  onRefresh,
  refreshing = false,
}: ProductListProps) {
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <ProductCard product={item} />}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}

const styles = StyleSheet.create({
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8, // để tránh dính mép nếu cần
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
});