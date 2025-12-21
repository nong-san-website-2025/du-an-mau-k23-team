// Lấy API URL từ env
const API_URL = process.env.REACT_APP_API_URL;
// Tạo Base URL (bỏ /api) để dùng cho hình ảnh. Ví dụ: http://localhost:8000
const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:8000";

export const removeVietnameseAccents = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const getProductIdFromCartItem = (item) => {
  if (item.product_data?.id != null) return item.product_data.id;
  if (item.product?.id != null) return item.product.id;
  if (item.product != null) return item.product;
  return null;
};

export const formatProductImage = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  // SỬ DỤNG BASE_URL TỪ ENV
  if (image.startsWith('/')) return `${BASE_URL}${image}`;
  return '';
};