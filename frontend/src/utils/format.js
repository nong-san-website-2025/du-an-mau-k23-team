// utils/format.js
export function intcomma(x) {
  if (!x) return "0";
  // Ép kiểu số nguyên, bỏ phần thập phân
  const num = Math.round(x); 
  // Chèn dấu chấm phân cách nghìn
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
