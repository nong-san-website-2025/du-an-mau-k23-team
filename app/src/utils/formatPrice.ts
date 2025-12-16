// utils/format.ts

// 1. Lấy Root Domain từ biến môi trường (Không bao gồm /api)
// Ví dụ: http://192.168.2.3:8000
const BASE_URL = import.meta.env.VITE_API_URL || "http://10.0.2.2:8000";

/**
 * Định dạng số nguyên: 10000 → "10,000"
 */
export function intcomma(x: number | string | null | undefined): string {
  if (x === null || x === undefined || x === "" || Number.isNaN(Number(x))) {
    return "0";
  }
  const num = Math.round(Number(x));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Định dạng số tổng quát: 10000.5 → "10,000.50"
 */
export function intcommaGeneral(x: number | string | null | undefined): string {
  if (x === null || x === undefined || x === "" || Number.isNaN(Number(x))) {
    return "0";
  }
  const num = Number(x);
  const [integer, decimal] = num.toFixed(2).split(".");
  const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${intFormatted}.${decimal}`;
}

/**
 * Xử lý URL hình ảnh
 * Input: "/media/abc.jpg" hoặc "abc.jpg" hoặc "http://..."
 * Output: Full URL "http://192.168.2.3:8000/media/abc.jpg"
 */
export function resolveImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return "";
  
  // 1. Nếu ảnh đã có link đầy đủ (VD: ảnh lấy từ Facebook, Google...)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  
  // 2. Xử lý đường dẫn tương đối
  // Xóa dấu / ở đầu để tránh bị double slash (//) khi nối
  const cleanPath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;

  // Kiểm tra xem backend trả về có sẵn chữ "media" trong path chưa
  // Django thường trả về: "/media/products/img.png" -> Có sẵn media
  // Hoặc đôi khi chỉ trả: "products/img.png" -> Thiếu media

  if (cleanPath.startsWith("media/")) {
      // Nếu có sẵn chữ media, nối trực tiếp vào BASE_URL
      // Kết quả: http://192.168.2.3:8000/media/products/...
      return `${BASE_URL}/${cleanPath}`;
  }
  
  // Nếu chưa có, chèn thêm /media/ vào giữa
  // Kết quả: http://192.168.2.3:8000/media/anh_abc.jpg
  return `${BASE_URL}/media/${cleanPath}`;
}