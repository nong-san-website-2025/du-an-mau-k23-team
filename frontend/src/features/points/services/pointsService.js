// services/pointsService.js
import axios from "axios";

// Lấy API URL từ env và nối thêm endpoint /users
// Kết quả sẽ là: http://localhost:8000/api/users
const API_URL = `${process.env.REACT_APP_API_URL}/users`;

// Lấy điểm hiện tại từ API /points/
export const getUserPoints = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/points/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // API /points/ trả về { points: ... }
    return { points: res.data.points || 0 };
  } catch (error) {
    console.error("Lỗi khi lấy điểm:", error);
    return { points: 0 };
  }
};

// Cộng điểm cho user
export const addUserPoints = async (token, amount) => {
  try {
    const res = await axios.post(
      `${API_URL}/points/`,
      { points: amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cộng điểm:", error);
  }
};

// Trừ điểm cho user
export const subtractUserPoints = async (token, amount) => {
  try {
    const res = await axios.patch(
      `${API_URL}/points/`,
      { points: amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    console.error("Lỗi khi trừ điểm:", error);
  }
};