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
  price: number; // Nên để number để tính toán, chỉ format khi render
  description?: string;
  
  unit?: string;
  // Hình ảnh
  image?: string | null; // Ảnh đại diện chính (thumbnail)
  images?: ProductImage[]; // Danh sách ảnh chi tiết
  
  // Quan hệ (Union Type: ID hoặc Object)
  category?: number | Category;
  subcategory?: number | Subcategory;
  subcategory_name?: string;
  
  // Store (Quan trọng cho logic Giỏ hàng)
  store?: number | Store | null;
  store_name?: string; // Field tiện ích nếu backend flatten dữ liệu
  
  // Khác
  brand?: string;
  inventory_qty?: number;
  preorder?: boolean;
  rating_average?: number;
  created_at?: string;

  ordered_quantity?: number;     // Số lượng đã đặt
  expected_quantity?: number;    // Số lượng dự kiến về
  estimated_quantity?: number;   // (Dự phòng nếu backend trả tên khác)
  stock?: number;
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

// ==========================================
// 6. ORDER (ĐƠN HÀNG - Chuẩn bị cho bước sau)
// ==========================================
export interface OrderItem {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  product_image?: string;
}

export interface Order {
  id: number;
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  shipping_address?: string;
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