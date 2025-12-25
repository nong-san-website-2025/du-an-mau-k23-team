import axios, { 
  AxiosRequestConfig, 
  AxiosError, 
  InternalAxiosRequestConfig,
  AxiosResponse 
} from 'axios';
import { SecureStorage } from '../utils/secureStorage';

// =================================================================
// TYPE DEFINITIONS (Giữ nguyên)
// =================================================================
interface ApiErrorResponse {
  detail?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
}

interface FailedRequestPromise {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

// =================================================================
// CONFIGURATION (✅ SỬA PHẦN NÀY)
// =================================================================

// 1. Lấy Root Domain từ biến môi trường (Giống file format.ts)
// VD: "http://192.168.2.3:8000" (Không có /api)
const BASE_URL = import.meta.env.VITE_API_URL || "http://10.0.2.2:8000";
// const BASE_URL = "http://10.0.2.2:8000" ;

// 2. Tạo Instance chuyên dùng cho API Data
const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`, // 👉 Nối thêm /api ở đây
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =================================================================
// INTERCEPTORS
// =================================================================

// 1. REQUEST INTERCEPTOR (Giữ nguyên)
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStorage.getToken();
    if (token) {
      if (!config.headers) {
        config.headers = new axios.AxiosHeaders();
      }
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// 2. RESPONSE INTERCEPTOR
let isRefreshing = false;
let failedQueue: FailedRequestPromise[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
                if (!originalRequest.headers) {
                    originalRequest.headers = new axios.AxiosHeaders();
                }
                originalRequest.headers.set('Authorization', `Bearer ${token}`);
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStorage.getRefreshToken();
        
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        // ✅ SỬA URL CHỖ GỌI REFRESH TOKEN
        // Vì dùng axios gốc (không qua instance), phải truyền Full URL
        const { data } = await axios.post<RefreshTokenResponse>(`${BASE_URL}/api/users/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;
        
        await SecureStorage.setToken(newAccessToken);
        
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        if (!originalRequest.headers) {
             originalRequest.headers = new axios.AxiosHeaders();
        }
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);

        processQueue(null, newAccessToken);
        
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStorage.clearAuth();
        // Dispatch event để App.tsx biết mà chuyển về trang Login
        window.dispatchEvent(new CustomEvent('user-logged-out'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Phần xử lý lỗi giữ nguyên vì bạn viết đã tốt rồi
    let errorMessage = "Lỗi kết nối server";
    if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.detail) {
            errorMessage = data.detail;
        } else if (data.message) {
            errorMessage = data.message;
        } else {
            const keys = Object.keys(data);
            if (keys.length > 0) {
                const firstKey = keys[0];
                const firstValue = data[firstKey];
                if (Array.isArray(firstValue)) {
                    errorMessage = `${firstKey}: ${firstValue[0]}`;
                } else {
                    errorMessage = JSON.stringify(data);
                }
            }
        }
    } else if (error.message) {
        errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// =================================================================
// API WRAPPER (Giữ nguyên)
// =================================================================
export const API = {
  get: async <T, P = Record<string, unknown>>(url: string, params?: P): Promise<T> => {
    const response = await axiosInstance.get<T>(url, { params });
    return response.data;
  },

  post: async <T, D = unknown>(url: string, data: D, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  put: async <T, D = unknown>(url: string, data: D): Promise<T> => {
    const response = await axiosInstance.put<T>(url, data);
    return response.data;
  },

  patch: async <T, D = unknown>(url: string, data: D): Promise<T> => {
    const response = await axiosInstance.patch<T>(url, data);
    return response.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await axiosInstance.delete<T>(url);
    return response.data;
  },
};