// src/utils/priceUtils.js

/**
 * Hàm lấy giá bán chuẩn nhất của sản phẩm.
 * Ưu tiên: Giá khuyến mãi (nếu > 0) -> Giá gốc -> Giá thường -> 0
 */
export const getFinalPrice = (item) => {
  if (!item) return 0;

  // 1. Chuẩn hóa dữ liệu: Lấy object chứa thông tin giá
  // Trong giỏ hàng nó nằm ở product_data, ở trang chi tiết nó nằm ở chính object
  const p = item.product_data || item.product || item;

  // 2. Lấy các giá trị thô và ép kiểu về số (Float)
  const discount = parseFloat(p.discounted_price);
  const original = parseFloat(p.original_price);
  const standard = parseFloat(p.price);

  // 3. LOGIC QUAN TRỌNG:
  // Chỉ lấy giá khuyến mãi nếu nó là số hợp lệ VÀ lớn hơn 0
  if (!isNaN(discount) && discount > 0) {
    return discount;
  }

  // Nếu không có KM, lấy giá gốc (original_price)
  if (!isNaN(original) && original > 0) {
    return original;
  }

  // Cuối cùng, lấy giá thường (price) nếu có
  if (!isNaN(standard) && standard > 0) {
    return standard;
  }

  // Nếu item là CartItem và có trường price ở ngoài cùng
  const itemPrice = parseFloat(item.price);
  if (!isNaN(itemPrice) && itemPrice > 0) {
      return itemPrice;
  }

  return 0;
};