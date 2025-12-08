// src/utils/formatPrice.ts
export const formatPriceVND = (price: string | number): string => {
  const num = Number(price);
  if (isNaN(num)) return String(price);
  return num.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
  });
};