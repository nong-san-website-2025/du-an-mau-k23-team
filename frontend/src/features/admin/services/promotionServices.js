import axiosClient from "./axiosClient";

const API_URL = "/promotions"; // vì axiosClient đã có baseURL

// --- Flash Sale API ---
export const getFlashSales = async () => {
  const res = await axiosClient.get(`${API_URL}/flashsales/`);
  return res.data;
};

// --- Voucher API ---
export const getPromotions = async () => {
  const res = await axiosClient.get(`${API_URL}/overview/`);
  return res.data;
};

export const getVoucher = async (id) => {
  const res = await axiosClient.get(`${API_URL}/vouchers/${id}/`);
  return res.data;
};

export const createVoucher = async (data) => {
  const res = await axiosClient.post(`${API_URL}/vouchers/`, data);
  return res.data;
};

export const updateVoucher = async (id, data) => {
  const res = await axiosClient.put(`${API_URL}/vouchers/${id}/`, data);
  return res.data;
};

export const deleteVoucher = async (id) => {
  const res = await axiosClient.delete(`${API_URL}/vouchers/${id}/`);
  return res.data;
};

export const getPromotionsOverview = async () => {
  const res = await axiosClient.get("/promotions/overview/");
  return res.data;
};

