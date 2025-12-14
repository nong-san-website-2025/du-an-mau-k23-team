import { useState, useEffect } from "react";
import { productApi } from "../api/productApi";
import { Category } from "../types/models"; // ✅ Import đúng

export default function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productApi.getCategories(); // ✅ Không ép kiểu nữa

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