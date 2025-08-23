import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const API_URL = process.env.REACT_APP_API_URL; // từ .env

// Axios instance dùng chung
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Gắn token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Login function
const login = async (username, password) => {
  try {
    const { data } = await api.post('users/login/', { username, password });
    // Lưu token + role vào localStorage
    localStorage.setItem('token', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('username', data.username);
    localStorage.setItem('is_admin', data.is_admin);
    localStorage.setItem('is_seller', data.is_seller);

    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.response?.data?.detail || 'Login failed' };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load info từ localStorage
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const is_admin = localStorage.getItem('is_admin') === 'true';
    const is_seller = localStorage.getItem('is_seller') === 'true';

    if (token && username) {
      setUser({ token, username, is_admin, is_seller, isAuthenticated: true });
    }
    setLoading(false);
  }, []);

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
    isAuthenticated: () => !!user?.isAuthenticated,
    isAdmin: () => user?.is_admin,
    isSeller: () => user?.is_seller,
    api,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
