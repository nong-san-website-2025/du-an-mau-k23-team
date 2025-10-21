// src/utils/secureStorage.ts
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'; // ✅ Tên đúng

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const GUEST_CART_KEY = 'guest_cart';

export const SecureStorage = {
  async getToken(): Promise<string | null> {
    try {
      const result = await SecureStoragePlugin.get({ key: TOKEN_KEY });
      return result.value;
    } catch (error) {
      console.warn('Failed to get token from secure storage:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    await SecureStoragePlugin.set({ key: TOKEN_KEY, value: token });
  },

  async removeToken(): Promise<void> {
    await SecureStoragePlugin.remove({ key: TOKEN_KEY });
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const result = await SecureStoragePlugin.get({ key: REFRESH_TOKEN_KEY });
      return result.value;
    } catch (error) {
      console.warn('Failed to get refresh token:', error);
      return null;
    }
  },

  async setRefreshToken(refreshToken: string): Promise<void> {
    await SecureStoragePlugin.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStoragePlugin.remove({ key: REFRESH_TOKEN_KEY });
  },

  async getGuestCart(): Promise<string | null> {
    try {
      const result = await SecureStoragePlugin.get({ key: GUEST_CART_KEY });
      return result.value;
    } catch (error) {
      console.warn('Failed to get guest cart:', error);
      return null;
    }
  },

  async setGuestCart(cartJson: string): Promise<void> {
    await SecureStoragePlugin.set({ key: GUEST_CART_KEY, value: cartJson });
  },

  async removeGuestCart(): Promise<void> {
    await SecureStoragePlugin.remove({ key: GUEST_CART_KEY });
  },
};