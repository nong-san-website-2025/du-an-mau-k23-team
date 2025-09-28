import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";

const categories = [
  { id: "1", name: "Trái cây", image: require("@/assets/images/fruit.png") },
  { id: "2", name: "Rau củ", image: require("@/assets/images/vegetable.png") },
  { id: "3", name: "Thịt tươi", image: require("@/assets/images/meat.png") },
  { id: "4", name: "Hải sản", image: require("@/assets/images/seafood.png") },
];

export default function CategoryGrid({ scrollEnabled = true }) {
  return (
    <FlatList
      data={categories}
      numColumns={4}
      keyExtractor={(item) => item.id}
      scrollEnabled={false} // ✅ Tắt cuộn, tránh xung đột
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item}>
          <Image source={item.image} style={styles.image} />
          <Text style={styles.name}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    textAlign: "center",
  },
});
