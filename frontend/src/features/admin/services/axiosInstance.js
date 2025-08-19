// frontend/src/services/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api", // base URL của Django API
});

// Thêm token vào header Authorization trước khi gửi request
axiosInstance.interceptors.request.use(
  (config) => {
    // 👇 lấy token đúng key mà bạn đang lưu trong Local Storage
    const token = localStorage.getItem("token");  

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
