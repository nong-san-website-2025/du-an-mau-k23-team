// src/api/api.ts
import { SecureStorage } from "./../utils/secureStorage"; // ✅ Import mới

const API_URL = "http://10.0.2.2:8000/api";

// ✅ DÙNG SECURE STORAGE THAY VÌ LOCALSTORAGE
const getToken = async (): Promise<string | null> => {
  return await SecureStorage.getToken();
};

const getRefreshToken = async (): Promise<string | null> => {
  return await SecureStorage.getRefreshToken();
};

const clearAuth = async () => {
  await SecureStorage.removeToken();
  await SecureStorage.removeRefreshToken();
};

const buildHeaders = async (
  isAuth = false,
  isFormData = false
): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {};
  if (isAuth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
};

const refreshToken = async (): Promise<string> => {
  const refresh = await getRefreshToken();
  if (!refresh) throw new Error("Refresh token không tồn tại");

  const res = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) throw new Error("Làm mới token thất bại");

  const data = await res.json();
  await SecureStorage.setToken(data.access); // ✅ Lưu vào secure storage
  return data.access;
};

// ================== CORE REQUEST ==================
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  config: { auth?: boolean } = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = await buildHeaders(config.auth, isFormData); // ✅ await

  const fetchConfig: RequestInit = {
    method: options.method || "GET",
    headers: { ...headers, ...(options.headers || {}) },
    body: options.body || null,
  };

  let response = await fetch(url, fetchConfig);

  if (response.status === 401 && config.auth) {
    try {
      const newToken = await refreshToken();
      (
        fetchConfig.headers as Record<string, string>
      ).Authorization = `Bearer ${newToken}`;
      response = await fetch(url, fetchConfig);
    } catch {
      await clearAuth();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  if (!response.ok) {
    let msg = "Đã xảy ra lỗi";
    try {
      const err = await response.json();
      msg = err.message || err.detail || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return response.json() as Promise<T>;
}

// ================== WRAPPER ==================
export const API = {
  get: <T>(endpoint: string, auth = false) =>
    request<T>(endpoint, { method: "GET" }, { auth }),

  post: <T, B = unknown>(endpoint: string, body: B, auth = false) =>
    request<T>(
      endpoint,
      { method: "POST", body: JSON.stringify(body) },
      { auth }
    ),

  patch: <T, B = unknown>(endpoint: string, body: B, auth = false) =>
    request<T>(
      endpoint,
      { method: "PATCH", body: JSON.stringify(body) },
      { auth }
    ),

  delete: <T>(endpoint: string, auth = false) =>
    request<T>(endpoint, { method: "DELETE" }, { auth }),
};

// Export nếu cần (ít dùng)
export { getToken, clearAuth };