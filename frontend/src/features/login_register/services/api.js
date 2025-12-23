// src/login_register/services/api.js
import axios from "axios";

// Xác định API base URL một cách linh hoạt để tránh dính IP cũ khi dev
const deriveApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  try {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (envUrl) {
      const u = new URL(envUrl);
      const envHost = u.hostname;
      const isPrivateLan =
        envHost.startsWith("192.168.") ||
        envHost.startsWith("10.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(envHost);

      // Nếu đang chạy trên localhost nhưng env trỏ tới LAN IP/host khác, ưu tiên localhost
      if (isLocalHost && (isPrivateLan || envHost !== window.location.hostname)) {
        return `${window.location.protocol}//${window.location.hostname}:8000/api`;
      }
      return envUrl;
    }
    // Không có env thì fallback theo host hiện tại
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  } catch (e) {
    // URL không hợp lệ => fallback
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
};

const API_URL = deriveApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token nếu 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes("/login/") || originalRequest.url.includes("login")) {
        return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh");
        
        if (!refresh) {
            throw new Error("No refresh token");
        }

        const res = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;
        localStorage.setItem("token", newAccess);
        
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        
        return api(originalRequest);
      } catch (err) {
        console.warn("Unauthorized - user needs to login");
        
        ["token", "refresh", "username", "role", "is_admin", "is_seller"].forEach((k) =>
          localStorage.removeItem(k)
        );
        
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;