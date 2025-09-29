// src/api/productApi.ts
import { getToken, getRefreshToken, setToken } from '@/utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL in .env');
}

// Hàm refresh token
async function refreshToken() {
  const refresh = await getRefreshToken();
  if (!refresh) throw new Error('Không tìm thấy refresh token');

  const response = await fetch(`${API_URL}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) throw new Error('Không thể làm mới token');

  const data = await response.json();
  await setToken(data.access);
  return data.access;
}

// Hàm request chính
async function request(
  endpoint: string,
  options: RequestInit = {},
  { auth = false }: { auth?: boolean } = {}
) {
  const url = `${API_URL}${endpoint}`;
  let headers: HeadersInit = {};

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers: { ...headers, ...(options.headers || {}) },
    body: options.body || null,
  };

  let response = await fetch(url, config);

  // Xử lý token hết hạn
  if (response.status === 401 && auth) {
    try {
      const newToken = await refreshToken();
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${newToken}`,
      };
      response = await fetch(url, config);
    } catch {
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Có lỗi xảy ra');
  }

  return response.json();
}

// Export API
export const productApi = {
  // Public
  getAllProducts: () => request('/products/'),
  getFeaturedProducts: () => request('/products/featured/'),
  getCategories: () => request('/products/categories/'),

  // Private (có auth)
  getSellers: () => request('/sellers/', {}, { auth: true }),
  createProduct: (productData: any) =>
    request('/products/', {
      method: 'POST',
      body: productData instanceof FormData ? productData : JSON.stringify(productData),
    }, { auth: true }),
  // ... các hàm khác bạn cần
};