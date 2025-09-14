import axiosClient from "./axiosClient";

const API_URL = "/promotions"; // axiosClient đã có baseURL

// ====================
// VOUCHER API
// ====================

// Lấy danh sách voucher
export const getVouchers = async () => {
  const res = await axiosClient.get(`${API_URL}/vouchers/`);
  return res.data;
};

// Lấy chi tiết 1 voucher
export const getVoucher = async (id) => {
  const res = await axiosClient.get(`${API_URL}/vouchers/${id}/`);
  return res.data;
};

// Tạo voucher mới
export const createVoucher = async (data) => {
  const res = await axiosClient.post(`${API_URL}/vouchers/`, data);
  return res.data;
};

// Cập nhật voucher
export const updateVoucher = async (id, data) => {
  const res = await axiosClient.put(`${API_URL}/vouchers/${id}/`, data);
  return res.data;
};

// Xóa voucher
export const deleteVoucher = async (id) => {
  const res = await axiosClient.delete(`${API_URL}/vouchers/${id}/`);
  return res.data;
};

// ====================
// FLASH SALE API
// ====================

// Lấy danh sách flash sale
export const getFlashSales = async () => {
  const res = await axiosClient.get(`${API_URL}/flashsales/`);
  return res.data;
};

// Lấy chi tiết 1 flash sale
export const getFlashSale = async (id) => {
  const res = await axiosClient.get(`${API_URL}/flashsales/${id}/`);
  return res.data;
};

// Tạo flash sale mới
export const createFlashSale = async (data) => {
  const res = await axiosClient.post(`${API_URL}/flashsales/`, data);
  return res.data;
};

// Cập nhật flash sale
export const updateFlashSale = async (id, data) => {
  const res = await axiosClient.put(`${API_URL}/flashsales/${id}/`, data);
  return res.data;
};

// Xóa flash sale
export const deleteFlashSale = async (id) => {
  const res = await axiosClient.delete(`${API_URL}/flashsales/${id}/`);
  return res.data;
};

// ====================
// OVERVIEW
// ====================

// Tổng quan khuyến mãi (voucher + flash sale)
export const getPromotionsOverview = async () => {
  const res = await axiosClient.get(`${API_URL}/overview/`);
  return res.data;
};
