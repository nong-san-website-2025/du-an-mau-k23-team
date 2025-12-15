import axios, { 
  AxiosRequestConfig, 
  AxiosError, 
  InternalAxiosRequestConfig,
  AxiosResponse 
} from 'axios';
import { SecureStorage } from '../utils/secureStorage';

// =================================================================
// TYPE DEFINITIONS (Định nghĩa kiểu dữ liệu chặt chẽ)
// =================================================================

// 1. Cấu trúc lỗi trả về từ Django REST Framework
interface ApiErrorResponse {
  detail?: string;
  message?: string;
  code?: string;
  [key: string]: unknown; // Cho phép các field lỗi validation khác (ví dụ: { "email": ["Invalid"] })
}

// 2. Cấu trúc của hàng đợi các request bị lỗi chờ Refresh Token
interface FailedRequestPromise {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

// 3. Cấu trúc response khi refresh token thành công
interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

// =================================================================
// CONFIGURATION
// =================================================================

const API_URL = "http://192.168.2.3:8000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =================================================================
// INTERCEPTORS
// =================================================================

// 1. REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStorage.getToken();
    if (token) {
      // Đảm bảo headers tồn tại trước khi gán
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

// Hàm xử lý hàng đợi: Duyệt qua các promise đang chờ và resolve/reject chúng
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

    // Nếu lỗi là 401 và chưa từng retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // Nếu đang refresh, xếp request này vào hàng đợi
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

        // Gọi API refresh
        const { data } = await axios.post<RefreshTokenResponse>(`${API_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;
        
        // Lưu token mới
        await SecureStorage.setToken(newAccessToken);
        
        // Update header mặc định cho các request sau
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Update header cho request hiện tại đang bị lỗi
        if (!originalRequest.headers) {
             originalRequest.headers = new axios.AxiosHeaders();
        }
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);

        // Xử lý hàng đợi
        processQueue(null, newAccessToken);
        
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStorage.clearAuth();
        window.dispatchEvent(new CustomEvent('user-logged-out'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Xử lý Error Message chặt chẽ hơn (không dùng any)
    let errorMessage = "Lỗi kết nối server";
    
    if (error.response && error.response.data) {
        const data = error.response.data;
        // Kiểm tra từng trường hợp cụ thể của API Django
        if (data.detail) {
            errorMessage = data.detail;
        } else if (data.message) {
            errorMessage = data.message;
        } else {
            // Trường hợp lỗi validation fields (ví dụ: { "password": ["Too short"] })
            // Ta lấy value đầu tiên của key đầu tiên để hiển thị
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
// API WRAPPER (Strict Typed)
// =================================================================

export const API = {
  // T: Kiểu dữ liệu trả về (Response Type)
  // P: Kiểu dữ liệu của Params (Query parameters)
  get: async <T, P = Record<string, unknown>>(url: string, params?: P): Promise<T> => {
    const response = await axiosInstance.get<T>(url, { params });
    return response.data;
  },

  // T: Response Type
  // D: Data Body Type (Payload)
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