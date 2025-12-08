// src/features/marketing/api/bannerApi.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "";

export const fetchSidebarBanners = () =>
  axios
    .get(`${API_BASE}/marketing/banners/?slot=sidebar_right`)
    .then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      // fallback: nếu không có banner cho slot này, lấy tất cả banner active
      return axios
        .get(`${API_BASE}/marketing/banners/`)
        .then((r) => (Array.isArray(r.data) ? r.data : []))
        .catch(() => []);
    })
    .catch(() => []);