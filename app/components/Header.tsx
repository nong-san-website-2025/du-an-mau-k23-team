import React from 'react';
import { View, TextInput, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          placeholder="Tìm sản phẩm, cửa hàng..."
          style={styles.searchInput}
        />
      </View>

      {/* Icon giỏ hàng */}
      <TouchableOpacity>
        <Ionicons name="cart-outline" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    marginHorizontal: 10,
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    marginLeft: 6,
  },
});
