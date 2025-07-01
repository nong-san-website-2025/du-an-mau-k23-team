import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/token/';
const API_ME_URL = 'http://localhost:8000/api/users/me/';

export const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL, { username, password });
    const token = response.data.access; // lấy access token từ JWT
    localStorage.setItem('token', token);
    return { success: true, token };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || 'Lỗi không xác định' };
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { success: false, error: 'Chưa đăng nhập' };
  }

  try {
    const response = await axios.get(API_ME_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || 'Lỗi khi lấy thông tin user' };
  }
};