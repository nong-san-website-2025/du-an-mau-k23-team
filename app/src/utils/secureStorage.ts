import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'greenfarm_access_token';
const REFRESH_TOKEN_KEY = 'greenfarm_refresh_token';
const GUEST_CART_KEY = 'greenfarm_guest_cart';

export const SecureStorage = {
  // --- ACCESS TOKEN ---
  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  },

  async setToken(token: string): Promise<void> {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  },

  async removeToken(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
  },

  // --- REFRESH TOKEN ---
  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
    return value;
  },

  async setRefreshToken(token: string): Promise<void> {
    await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token });
  },

  async removeRefreshToken(): Promise<void> {
    await Preferences.remove({ key: REFRESH_TOKEN_KEY });
  },

  // --- GUEST CART ---
  async getGuestCart(): Promise<string | null> {
    const { value } = await Preferences.get({ key: GUEST_CART_KEY });
    return value;
  },

  async setGuestCart(cartJson: string): Promise<void> {
    await Preferences.set({ key: GUEST_CART_KEY, value: cartJson });
  },

  async removeGuestCart(): Promise<void> {
    await Preferences.remove({ key: GUEST_CART_KEY });
  },

  // --- CLEAR ALL (Dùng khi logout sạch sẽ) ---
  async clearAuth(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: REFRESH_TOKEN_KEY });
  }
};