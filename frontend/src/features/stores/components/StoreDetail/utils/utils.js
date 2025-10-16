// src/features/stores/components/StoreDetail/utils.js

export const formatVND = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return Math.round(n).toLocaleString("vi-VN");
};

export const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

export const getInitial = (name) =>
  name ? String(name).trim().charAt(0).toUpperCase() : "S";