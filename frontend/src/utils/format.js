// utils/format.js
export function intcomma(x) {
  if (!x) return "0";
  // Ép kiểu số nguyên, bỏ phần thập phân
  const num = Math.round(x); 
  // Chèn dấu chấm phân cách nghìn
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function intcommaGeneral(x) {
  if (x == null || x === "") return "0";

  const num = Number(x);

  // Tách phần nguyên & phần thập phân (3 số)
  const [integer, decimal] = num.toFixed(2).split(".");

  // Thêm dấu phẩy phân cách hàng nghìn
  const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${intFormatted}.${decimal}`;
}
