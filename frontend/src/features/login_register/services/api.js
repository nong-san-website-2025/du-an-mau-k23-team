// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // Lấy từ .env

const API = axios.create({
  baseURL: API_URL, // dùng biến môi trường
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn access token vào mọi request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho response: Tự động refresh token nếu access token hết hạn
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Nếu lỗi 401 và chưa thử refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) throw new Error('No refresh token');
        // Gọi API refresh token
        const res = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = res.data.access;
        // Lưu access token mới
        localStorage.setItem('token', newAccessToken);
        // Gắn lại header và retry request cũ
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Nếu refresh cũng fail thì logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
