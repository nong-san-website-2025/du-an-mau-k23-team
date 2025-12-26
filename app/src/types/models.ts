// src/types/models.ts

// ==========================================
// 1. AUTH & USER
// ==========================================
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar?: string;
  avatar_url?: string; // Một số API trả về url đầy đủ
  role: "admin" | "seller" | "customer";
}

// ==========================================
// 2. STORE (CỬA HÀNG)
// ==========================================
export interface Store {
  id: number;
  name: string;          // Tên hiển thị chuẩn
  store_name?: string;   // Alias phòng trường hợp backend trả về tên này
  
  image?: string | null;
  avatar?: string | null;
  
  address?: string;
  rating?: number;
  followers?: number;    // Số người theo dõi (tính năng mở rộng)
}

// ==========================================
// 3. CATEGORY (DANH MỤC)
// ==========================================
export interface Category {
  id: number;
  name: string;
  image?: string | null;
  icon?: string | null;
}

export interface Subcategory {
  id: number;
  name: string;
  category: number | Category;
}

// ==========================================
// 4. PRODUCT (SẢN PHẨM)
// ==========================================
export interface ProductImage {
  id: number;
  image: string;
  is_primary?: boolean;
}

export interface Product {
  id: number;
  name: string;
  
  // --- GIÁ CẢ ---
  price: number;              // Giá bán
  original_price?: number;    // Giá gốc (gạch ngang)
  discount_percent?: number;  // % giảm giá
  
  description?: string;
  unit?: string;              // Đơn vị: kg, hộp...

  // --- HÌNH ẢNH ---
  image?: string | null;      // Ảnh đại diện chính
  images?: ProductImage[];    // Album ảnh chi tiết

  main_image?: string | null; // Ảnh đại diện chính (để tránh gọi API nhiều lần)
  
  // --- PHÂN LOẠI ---
  category?: number | Category;
  subcategory?: number | Subcategory;
  
  // --- CỬA HÀNG ---
  store?: number | Store | null; // Object Store đầy đủ hoặc ID
  store_name?: string;           // Tên shop (flattened)
  brand?: string;

  // --- THỐNG KÊ & TRẠNG THÁI ---
  sold?: number;              // Số lượng đã bán
  sold_count?: number;        // Alias
  
  inventory_qty?: number;     // Tổng tồn kho
  stock?: number;             // Tồn kho khả dụng
  
  rating?: string | number;   // Điểm đánh giá (VD: 4.5)
  rating_count?: number;      // Số lượng đánh giá
  
  is_active?: boolean;        // Sản phẩm có đang mở bán không
}

// ==========================================
// 5. CART (GIỎ HÀNG)
// ==========================================
export interface CartItem {
  id?: number | string;       // ID item trong giỏ (Guest chưa có ID DB)
  
  product: number | string | Product; // ID hoặc Object Product
  product_id?: number | string;       // ID tham chiếu
  
  quantity: number;
  total_price?: number;       // Tổng tiền của item này (price * quantity)
  
  // --- UI STATE ---
  product_data?: Product;     // Dữ liệu sp để hiển thị (tên, ảnh...)
  selected?: boolean;         // Checkbox chọn mua
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_amount: number;
  item_count: number;
}

// ==========================================
// 6. ORDER (ĐƠN HÀNG) - ĐÃ CẬP NHẬT THEO JSON THỰC TẾ
// ==========================================

export type OrderStatus = 
  | 'pending'     // Chờ xác nhận
  | 'confirmed'   // Đã xác nhận
  | 'processing'  // Đang đóng gói
  | 'shipping'    // Đang giao
  | 'delivered'   // Đã giao (Shipper báo)
  | 'completed'   // Hoàn thành (User xác nhận/Hết hạn đổi trả)
  | 'cancelled'   // Đã hủy
  | 'return'      // Trả hàng/Hoàn tiền
  | 'refunded';   // Đã hoàn tiền

export type PaymentMethod = 'Thanh toán khi nhận hàng' | 'VNPAY' | 'Chuyển khoản' | string;

// Item trong đơn hàng
export interface OrderItem {
  id: number;
  product_name: string;
  product_image?: string | null;
  
  // JSON thực tế thường trả về 'price'
  price: number | string; 
  quantity: number;
  
  variant_name?: string; // Nếu có phân loại (Size, Màu)
}

// Order chi tiết
export interface Order {
  id: number;
  
  // --- THÔNG TIN KHÁCH HÀNG ---
  user?: number;           // ID người mua
  customer_name?: string;  // Tên người nhận
  customer_phone?: string; // SĐT người nhận
  address?: string;        // Địa chỉ nhận hàng
  
  // --- THÔNG TIN CỬA HÀNG (QUAN TRỌNG) ---
  shop_name: string;       // Khớp với JSON: "shop_name"
  shop_phone?: string;     // Khớp với JSON: "shop_phone"
  store_id?: number;
  
  items: OrderItem[];
  
  // --- TÀI CHÍNH (string | number vì API trả về string "2121.00") ---
  total_price: string | number;   // Tổng tiền cuối cùng
  total_amount?: string | number; // Alias
  shipping_fee?: string | number;
  discount_amount?: string | number;

  // --- TRẠNG THÁI ---
  status: OrderStatus | string;   // Status code (delivered)
  status_display?: string;        // Status text (Đã giao hàng) - Rất tiện cho UI
  
  payment_method?: PaymentMethod;
  payment_status?: 'paid' | 'unpaid' | string;
  payment_status_display?: string; // "Chưa thanh toán"
  
  note?: string;

  created_at: string;          // Lúc đặt hàng
  confirmed_at?: string;       // Lúc shop xác nhận
  shipped_at?: string;         // Lúc giao cho shipper
  completed_at?: string;       // Lúc hoàn thành/giao thành công
  cancelled_at?: string;       // Lúc hủy đơn (nếu có)

  // --- THỜI GIAN ---
  created_at_formatted?: string;  // "17:13 28/10/2025"
  updated_at?: string;
}

// ==========================================
// 7. API RESPONSE TYPES
// ==========================================
// Dùng cho phân trang
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}