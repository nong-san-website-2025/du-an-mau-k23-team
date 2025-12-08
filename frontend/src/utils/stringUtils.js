/**
 * Tạo chuỗi ngẫu nhiên (Voucher Code)
 * Loại bỏ các ký tự dễ nhầm lẫn: 0, O, 1, I
 * @param {number} length - Độ dài mong muốn (mặc định 6)
 * @returns {string}
 */
export const generateVoucherCode = (length = 6) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Đã bỏ O, 0, I, 1
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    // Sử dụng Math.floor thay vì các thư viện nặng nề nếu không cần bảo mật crypto quá cao
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
};