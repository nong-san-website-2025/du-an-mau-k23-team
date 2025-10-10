const API_URL = "http://10.0.2.2:8000/api";

const getToken = (): string | null => localStorage.getItem("token");
const getRefreshToken = (): string | null =>
  localStorage.getItem("refresh_token");
const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
};

const buildHeaders = (
  isAuth = false,
  isFormData = false
): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (isAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
};

const refreshToken = async (): Promise<string> => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("Refresh token không tồn tại");

  const res = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) throw new Error("Làm mới token thất bại");

  const data = await res.json();
  localStorage.setItem("token", data.access);
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
  const headers = buildHeaders(config.auth, isFormData);

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
      clearAuth();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  if (!response.ok) {
    let msg = "Đã xảy ra lỗi";
    try {
      const err = await response.json();
      msg = err.message || err.detail || msg;
    } catch {
      // Không cần xử lý thêm nếu JSON không hợp lệ
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

// ✅ Export toàn bộ những gì file khác cần
export { getToken, clearAuth, request };
