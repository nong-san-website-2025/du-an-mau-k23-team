// frontend/src/features/admin/services/axiosInstance.js
import axios from "axios";

// Chuẩn hoá baseURL: đảm bảo chỉ có một lần '/api'
const rawBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
const trimmed = rawBase.replace(/\/+$/, "");
const baseURL = trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;

const axiosInstance = axios.create({ baseURL });

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
