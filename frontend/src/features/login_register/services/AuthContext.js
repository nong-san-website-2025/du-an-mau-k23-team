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
    return config;
  },
  (error) => Promise.reject(error)
);

// Hàm login dùng chung (thay cho file auth.js)
const login = async (username, password) => {
  try {
    const { data } = await api.post('users/login/', { username, password });
    // data: { access, refresh, username, email, is_admin, is_seller }
  localStorage.setItem('token', data.access);
  localStorage.setItem('refresh', data.refresh); // Lưu refresh token
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

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const value = {
    user,
    login: handleLogin,
    logout,
    isAuthenticated: () => user?.isAuthenticated,
    isAdmin: () => user?.is_admin,
    loading,
    api, // axios instance dùng chung
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
