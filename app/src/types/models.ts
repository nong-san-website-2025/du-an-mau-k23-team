// src/types/models.ts

// Người dùng
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
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