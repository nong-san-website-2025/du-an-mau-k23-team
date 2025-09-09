// src/services/promotionServices.js
import axios from "axios";

const API_URL = "http://localhost:8000/api/promotions/vouchers/";

// 🔑 Tạo sẵn axios instance, mọi request đều tự động có token
const api = axios.create({
  baseURL: "http://localhost:8000/api/",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // hoặc sessionStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================== SERVICES ==================

// Lấy vouchers (dùng trong PromotionsPage)
export const getVouchers = async () => {
  try {
    const res = await api.get("promotions/vouchers/");
    if (res.data && res.data.results && Array.isArray(res.data.results)) {
      return res.data.results;
    }
    return res.data;
  } catch (err) {
    console.error(
      "Error fetching vouchers:",
      err.response?.data || err.message || err
    );
    return [];
  }
};

// Lấy flashsales
export const getFlashSales = async () => {
  try {
    const res = await api.get("promotions/flashsales/");
    let data = res.data;
    if (data && data.results && Array.isArray(data.results))
      data = data.results;

    if (Array.isArray(data) && data.length > 0 && data[0].items !== undefined) {
      return data.flatMap((fs) =>
        (fs.items || []).map((it) => ({
          ...it,
          flashsale_title: fs.title,
          start_at: fs.start_at,
          end_at: fs.end_at,
        }))
      );
    }
    return data;
  } catch (err) {
    console.error(
      "Error fetching flash sales:",
      err.response?.data || err.message || err
    );
    return [];
  }
};

// Lấy danh sách promotions
export const getPromotions = async () => {
  try {
    const res = await api.get("promotions/vouchers/");
    return res.data;
  } catch (err) {
    console.error(
      "Error fetching promotions:",
      err.response?.data || err.message
    );
    return [];
  }
};

// Tạo mới promotion
export const createPromotion = async (data) => {
  try {
    const payload = {
      ...data,
      scope: "system", // fix cứng hệ thống
    };
    const res = await api.post("promotions/vouchers/", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err) {
    console.error(
      "Error creating promotion:",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ✅ Update promotion
export const updatePromotion = async (id, payload) => {
  const res = await api.put(`promotions/vouchers/${id}/`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

// ✅ Delete promotion
export const deletePromotion = async (id) => {
  await api.delete(`promotions/vouchers/${id}/`);
  return true;
};
