// ==========================================
// 1. AUTH & USER
// ==========================================
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string; // Thường cần cho giao hàng
  avatar?: string;
  role: "admin" | "seller" | "customer";
}

// ==========================================
// 2. STORE (CỬA HÀNG)
// ==========================================
export interface Store {
  id: number;
  // Nếu backend lúc trả 'store_name', lúc trả 'name', ta nên khai báo cả 2
  store_name?: string; 
  name?: string;       
  
  image?: string | null;
  avatar?: string | null; // <--- THÊM DÒNG NÀY (để StoreCard dùng được)
  
  address?: string;
  rating?: number;
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
  category: number | Category; // Có thể trả về ID hoặc Object đầy đủ
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
  
  // --- GIÁ CẢ (QUAN TRỌNG) ---
  price: number;              // Giá bán hiện tại (đã giảm)
  original_price?: number;    // Giá gốc (nếu có khuyến mãi thì field này > price)
  discount_percent?: number;  // Backend có thể tính sẵn hoặc Frontend tự tính
  
  description?: string;
  unit?: string;              // kg, bó, trái...

  // --- HÌNH ẢNH ---
  image?: string | null;      // Fallback
  images?: ProductImage[];    
  main_image?: ProductImage | null; // Ưu tiên dùng cái này

  // --- PHÂN LOẠI ---
  category?: number | Category;
  subcategory?: number | Subcategory;
  
  // --- CỬA HÀNG ---
  store?: number | Store | null;
  store_name?: string; 
  brand?: string;

  sold?: number;        // <--- Thêm dòng này
  sold_count?: number;  // <--- Thêm dòng này (nếu cần)

  // --- KHO & TRẠNG THÁI ---
  // Bạn có nhiều field na ná nhau, nên gom gọn logic:
  inventory_qty?: number;     // Tổng kho
  stock?: number;             // Số lượng có thể bán (thường là inventory - hold)
  ordered_quantity?: number;  // Số lượng ĐÃ BÁN (dùng để hiển thị "Đã bán 1k")
  
  preorder?: boolean;         // Hàng đặt trước

  rating?: string | number; // API trả về string "0.0" nhưng nên khai báo cả 2 cho chắc
  rating_average?: number;  // Giữ lại nếu cần backward compatibility
  
}

// ==========================================
// 5. CART (GIỎ HÀNG)
// ==========================================
// Interface thống nhất cho cả API response và Guest Cart
export interface CartItem {
  id?: number | string; // Guest item chưa có ID từ DB nên optional
  
  // Backend thường trả về ID của product trong field 'product'
  // Nhưng Guest Cart lưu cả object Product. Nên dùng Union Type.
  product: number | string | Product; 
  product_id?: number | string; // Field phụ để lấy ID chắc chắn
  
  quantity: number;
  total_price?: number; // Backend có thể tính sẵn hoặc Frontend tự tính
  preorder?: boolean;
  
  // --- UI STATE (Frontend tự thêm vào) ---
  // Dữ liệu sản phẩm đầy đủ sau khi normalized (để hiển thị tên, ảnh, giá)
  product_data?: Product; 
  
  // Trạng thái checkbox chọn mua
  selected?: boolean; 
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_amount: number;
  item_count: number;
}

export type PaymentMethod = 'cod' | 'vnpay' | 'banking';

export type OrderStatus = 
  | 'pending'       // Chờ xác nhận
  | 'confirmed'     // Đã xác nhận (Seller đồng ý)
  | 'processing'    // Đang đóng gói
  | 'shipping'      // Đang giao (kết nối GHN/GHTK)
  | 'completed'     // Giao thành công
  | 'cancelled'     // Đã hủy
  | 'refunded';     // Hoàn tiền

// ==========================================
// 6. ORDER (ĐƠN HÀNG - Chuẩn bị cho bước sau)
// ==========================================
export interface OrderItem {
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  
  // Lưu giá TẠI THỜI ĐIỂM MUA (quan trọng để đối soát sau này, dù giá gốc sp có đổi)
  price_at_purchase: number; 
  total_item_price: number;
}

export interface Order {
  id: number;
  user_id: number; // Người mua
  store_id: number; // Đơn hàng thường tách theo Store
  store_name?: string;

  items: OrderItem[];
  
  // --- TÀI CHÍNH ---
  total_goods_fee: number;    // Tiền hàng
  shipping_fee: number;       // Phí ship
  discount_amount?: number;   // Tiền giảm giá (Voucher)
  final_amount: number;       // Tổng thanh toán (Tiền hàng + Ship - Giảm giá)

  // --- THÔNG TIN GIAO HÀNG ---
  full_name: string;
  phone_number: string;
  shipping_address: string;   // Địa chỉ full
  note?: string;              // Ghi chú của khách

  // --- TRẠNG THÁI ---
  status: OrderStatus;
  payment_method: PaymentMethod;
  is_paid: boolean;           // Đã thanh toán chưa?
  
  // --- THỜI GIAN ---
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface GuestCartItem {
  product: number | string; // ID sản phẩm
  quantity: number;
  product_data: {           // Lưu thông tin cơ bản để hiển thị ngay
    id: number | string;
    name: string;
    price: number;
    image: string;
  };
}

// ✅ Bổ sung Interface cho phản hồi từ API khi lấy Cart
// (Dùng trong hàm logout để sync cart về local)
export interface CartResponseItem {
  id: number;
  product: number;          // ID sản phẩm (foreign key)
  quantity: number;
  product_data?: Product;   // Backend thường trả kèm chi tiết sp (nested serializer)
}