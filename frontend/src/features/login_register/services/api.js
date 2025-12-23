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