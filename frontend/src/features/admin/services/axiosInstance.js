// frontend/src/features/admin/services/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  // Sử dụng URL từ .env (CRA cần prefix REACT_APP_)
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
});

// Thêm token vào header Authorization trước khi gửi request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
