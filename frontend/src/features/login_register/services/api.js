// src/login_register/services/api.js
import axios from "axios";

// const API_URL = "http://192.168.68.117:8000/api"; // Hoặc process.env.REACT_APP_API_URL
const API_URL = process.env.REACT_APP_API_URL; // Hoặc process.env.REACT_APP_API_URL

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

    // 🔥 SỬA Ở ĐÂY: Kiểm tra xem URL có phải là login không
    // Nếu lỗi 401 xảy ra tại URL "/login/", nghĩa là sai pass -> Bỏ qua interceptor này để component tự xử lý
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
        
        // Nếu không có refresh token -> logout ngay
        if (!refresh) {
            throw new Error("No refresh token");
        }

        const res = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;
        localStorage.setItem("token", newAccess);
        
        // Gắn lại token mới vào header của request cũ
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        
        // Gọi lại request cũ
        return api(originalRequest);
      } catch (err) {
        // Nếu refresh token cũng lỗi (hết hạn hẳn) -> Xóa sạch và redirect về login
        console.warn("Session expired, redirecting to login...");
        
        ["token", "refresh", "username", "role", "is_admin", "is_seller"].forEach((k) =>
          localStorage.removeItem(k)
        );
        
        // ⚠️ Dòng này gây reload, nhưng chỉ chạy khi refresh token chết hẳn
        window.location.href = "/login"; 
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;