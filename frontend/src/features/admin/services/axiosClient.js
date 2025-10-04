import axios from "axios";
import { authApi } from "./authApi"; // để dùng logout & refresh

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // 👈 mình thống nhất dùng "token"
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Xử lý khi nhận response
// axiosClient.js
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await authApi.refreshToken();
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (err) {
        authApi.logout();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
