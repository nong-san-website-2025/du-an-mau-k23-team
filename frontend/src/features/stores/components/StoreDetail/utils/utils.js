// src/features/stores/components/StoreDetail/utils.js

export const formatVND = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  // Làm tròn và chuyển sang chuỗi với dấu phẩy thay cho dấu chấm
  return (
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫"
  );
};

export const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

export const getInitial = (name) =>
  name ? String(name).trim().charAt(0).toUpperCase() : "S";
