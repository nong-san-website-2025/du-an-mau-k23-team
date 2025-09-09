import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;
const API_URL = `${API_BASE_URL}/advertisements/`;

// Hàm lấy token từ localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// Lấy danh sách quảng cáo
export const getAdvertisements = (params = {}) =>
  axios.get(API_URL, {
    params,
    headers: getAuthHeaders(),
  });

// Tạo quảng cáo mới
export const createAdvertisement = (data) =>
  axios.post(API_URL, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...getAuthHeaders(),
    },
  });

// Cập nhật quảng cáo
export const updateAdvertisement = (id, data) =>
  axios.put(`${API_URL}${id}/`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...getAuthHeaders(),
    },
  });

// Xóa quảng cáo
export const deleteAdvertisement = (id) =>
  axios.delete(`${API_URL}${id}/`, {
    headers: getAuthHeaders(),
  });
