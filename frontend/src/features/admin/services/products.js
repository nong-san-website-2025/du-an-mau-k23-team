import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL; // 👈 lấy từ .env
const API_URL = `${API_BASE}/products/`;
const CATEGORY_URL = `${API_BASE}/products/categories/`;

// Hàm tiện ích: thêm token vào header
const authAxios = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// Lấy danh sách sản phẩm
export const getProducts = () =>
  authAxios().get(API_URL).then((res) => res.data);

// Thêm sản phẩm
export const addProduct = async (data) => {
  const res = await authAxios().post(API_URL, data);
  return res.data;
};

// Cập nhật sản phẩm
export const updateProduct = async (id, data) => {
  const res = await authAxios().put(`${API_URL}${id}/`, data);
  return res.data;
};

// Xóa sản phẩm
export const deleteProduct = async (id) => {
  const res = await authAxios().delete(`${API_URL}${id}/`);
  return res.data;
};

// Lấy danh mục
export async function getCategories() {
  const res = await authAxios().get(CATEGORY_URL);
  return Array.isArray(res.data) ? res.data : [];
}

export const addCategory = async (data) => {
  const res = await authAxios().post(CATEGORY_URL, data);
  return res.data;
};