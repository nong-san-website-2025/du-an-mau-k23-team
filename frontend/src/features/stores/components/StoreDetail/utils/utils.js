// src/features/stores/components/StoreDetail/utils.js

export const formatVND = (value, fontSize) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";

  const formattedNumber = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const baseSize = fontSize || 18;

  return (
    <span style={{ 
      fontSize: baseSize,  // ← Thêm dòng này
      color: "inherit", 
      fontWeight: "inherit" 
    }}>
      {formattedNumber}
      <sup style={{ fontSize: "0.7em" }}>₫</sup>
    </span>
  );
};

export const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

export const getInitial = (name) =>
  name ? String(name).trim().charAt(0).toUpperCase() : "S";
