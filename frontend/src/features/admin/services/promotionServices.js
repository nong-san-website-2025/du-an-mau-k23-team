
import axiosClient from "./axiosClient";
const API_URL = "/promotions"; // axiosClient đã có baseURL

// User nhận voucher từ kho (claim)
export const claimVoucher = async (code) => {
  try {
    const res = await axiosClient.post(
      `${API_URL}/vouchers/claim/`,  // ✅ thêm dấu /
      { code }                       // ✅ payload đúng key
    );
    return res.data;
  } catch (error) {
    console.error("Claim voucher error:", error.response?.data || error.message);
    throw error;
  }
};

// Lấy danh sách voucher đã sở hữu (túi voucher)
export const getMyVouchers = async () => {
  const res = await axiosClient.get(`${API_URL}/vouchers/my_vouchers/`);
  return res.data;
};

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

// Áp dụng voucher
// Áp dụng voucher
export const applyVoucher = async (code, orderTotal) => {
  const res = await axiosClient.post(`/promotions/vouchers/apply/`, {
    code: code,        // ✅ phải là "code", không phải "voucher_code"
    order_total: orderTotal,
  });
  return res.data;
};


//API để user nhận voucher từ kho voucher
