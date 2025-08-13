import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Tạo một instance axios chung cho toàn app
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Gắn access token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Không set Content-Type cho FormData, để browser tự động set
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý response để tự động refresh token khi cần
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:8000/api/users/token/refresh/', {
            refresh: refreshToken
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('token', newAccessToken);
          
          // Cập nhật header cho request gốc
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Thử lại request gốc
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token cũng hết hạn, logout user
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Không có refresh token, logout user
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Hàm login dùng chung (thay cho file auth.js)
const login = async (username, password) => {
  try {
    const { data } = await api.post('users/login/', { username, password });
    // data: { access, refresh, username, email, is_admin, is_seller }
    localStorage.setItem('token', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    localStorage.setItem('username', data.username);
    localStorage.setItem('is_admin', data.is_admin);
    localStorage.setItem('is_seller', data.is_seller);
    return {
      success: true,
      ...data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Đăng nhập thất bại.',
    };
  }
};

// Hàm refresh token
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post('http://localhost:8000/api/users/token/refresh/', {
      refresh: refreshToken
    });
    
    const newAccessToken = response.data.access;
    localStorage.setItem('token', newAccessToken);
    
    return {
      success: true,
      access: newAccessToken
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to refresh token'
    };
  }
};

// Hàm logout
const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const is_admin = localStorage.getItem('is_admin') === 'true';
    const is_seller = localStorage.getItem('is_seller') === 'true';
    
    if (token && username) {
      setUser({
        token,
        username,
        is_admin,
        is_seller,
        isAuthenticated: true,
      });
    }
    setLoading(false);
  }, []);

  // Đăng nhập: gọi login, cập nhật context
  const handleLogin = async (username, password) => {
    const result = await login(username, password);
    if (result.success) {
      setUser({
        token: result.access,
        username: result.username,
        is_admin: result.is_admin,
        is_seller: result.is_seller,
        isAuthenticated: true,
      });
    }
    return result;
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const value = {
    user,
    login: handleLogin,
    logout: handleLogout,
    refreshToken,
    isAuthenticated: () => user?.isAuthenticated,
    isAdmin: () => user?.is_admin,
    isSeller: () => user?.is_seller,
    loading,
    api, // axios instance dùng chung
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export API instance để các component khác có thể sử dụng trực tiếp
export { api };
