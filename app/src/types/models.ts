// src/types/models.ts

// Người dùng
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "seller" | "customer"; // ✅ Thêm dòng này
}

// Sản phẩm
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  brand?: string;
  image?: string;
  category?: number;
  subcategory_name?: string;
  created_at?: string;
}

// Danh mục
export interface Category {
  id: number;
  name: string;
  icon?: string;
  image?: string;
}

// Giỏ hàng
export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  total_price: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_amount: number;
  item_count: number;
}

export interface CartResponseItem {
  id: number;
  product: number; // ← chỉ là ID
  quantity: number;
  total_price: number;
  // Nếu backend có gửi product_data, thì thêm:
  product_data?: Product;
}

// 👇 Dữ liệu bạn lưu trong localStorage (guest_cart)
export interface GuestCartItem {
  product: number;
  quantity: number;
  product_data: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

// Danh mục con
export interface Subcategory {
  id: number;
  name: string;
  category: number; // ID của danh mục cha
}
