// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Dùng SecureStore cho token (an toàn hơn)
export const getToken = async () => {
  return await SecureStore.getItemAsync('token');
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync('refresh_token');
};

export const setToken = async (token: string) => {
  await SecureStore.setItemAsync('token', token);
};

export const setRefreshToken = async (refreshToken: string) => {
  await SecureStore.setItemAsync('refresh_token', refreshToken);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('refresh_token');
};