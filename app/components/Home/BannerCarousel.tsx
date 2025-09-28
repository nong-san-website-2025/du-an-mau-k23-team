import React from 'react';
import { Image, StyleSheet, View, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

const banners = [
  require('@/assets/images/banner1.jpg'),
  require('@/assets/images/banner2.png'),
];

export default function BannerCarousel() {
  return (
    <View style={styles.container}>
      <Carousel
        loop
        width={width}
        height={180}
        autoPlay
        data={banners}
        scrollAnimationDuration={2000}
        renderItem={({ item }) => (
          <Image source={item} style={styles.banner} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    marginBottom: 16,
  },
  banner: {
    width: width,
    height: 180,
    resizeMode: 'cover',
    borderRadius: 10,
  },
});
