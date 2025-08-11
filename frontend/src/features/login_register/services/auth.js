// src/services/auth.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/login/';

export const login = async (username, password) => {
  try {
    const { data } = await axios.post(API_URL, { username, password });

    return {
      success: true,
      ...data, // Bao gồm: access, refresh, username, email, is_admin, is_seller
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || "Đăng nhập thất bại.",
    };
  }
};
