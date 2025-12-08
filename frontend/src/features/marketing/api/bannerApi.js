// src/features/marketing/api/bannerApi.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "";

export const fetchSidebarBanners = () =>
  axios.get(`${API_BASE}/marketing/banners/?slot=sidebar_right`)
    .then(res => res.data)
    .catch(() => []);