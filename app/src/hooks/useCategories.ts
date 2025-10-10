import { useState, useEffect } from "react";
import { productApi } from "../api/productApi";

// ===== Định nghĩa kiểu dữ liệu =====
export interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  brand?: string;
}

export interface Category {
  id: number;
  name: string;
  products?: Product[];
  image: string;
}

// ===== Hook chính =====
export default function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Tải danh sách danh mục từ API
 * Đảm bảo kiểu dữ liệu trả về là một mảng các đối tượng Category
 * Nếu API trả về lỗi, sẽ in ra lỗi và setCategories thành một mảng rỗng
 */

/*******  d5b2859e-fbab-4969-82f5-42b7ee2ca901  *******/  useEffect(() => {

    const fetchCategories = async () => {
      try {
        const data = (await productApi.getCategories()) as Category[];  

        // ✅ Đảm bảo kiểu dữ liệu đúng
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("API không trả về danh sách danh mục hợp lệ:", data);
          setCategories([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  return categories;
}
