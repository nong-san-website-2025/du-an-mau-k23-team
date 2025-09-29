// ProductCard.tsx
import React from 'react';
import { Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image: any;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.card}>
      <Image source={product.image} style={styles.image} />
      <Text style={styles.name} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={styles.price}>{product.price.toLocaleString()} đ</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    flex: 1,
    marginHorizontal: 4, 
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  price: {
    fontSize: 14,
    color: '#E53935',
    fontWeight: 'bold',
  },
});