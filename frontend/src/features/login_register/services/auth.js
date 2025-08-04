// auth.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/login/';

export const login = async (username, password) => {
  try {
    const response = await axios.post("http://localhost:8000/api/users/login/", {
      username,
      password,
    });

    return {
      success: true,
      access: response.data.access, // JWT access token
      refresh: response.data.refresh, // JWT refresh token (optional)
      username: response.data.username,
      email: response.data.email,
      role: response.data.role,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Đăng nhập thất bại.",
    };
  }
};