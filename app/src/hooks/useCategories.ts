import { useState, useEffect, useCallback } from "react";
import { productApi } from "../api/productApi";
import { Category } from "../types/models";

export default function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  // 1. Thêm state để quản lý loading (UI sẽ hiện Skeleton khi true)
  const [loading, setLoading] = useState<boolean>(true);

  // 2. Tách logic gọi API ra thành hàm riêng và bọc trong useCallback
  // Lý do: Để có thể gọi lại hàm này khi người dùng "kéo để làm mới" (Pull to refresh)
  const fetchCategories = useCallback(async () => {
    try {
      // Lưu ý: Không set loading=true ở đây nếu muốn "kéo làm mới" mượt mà (không nháy skeleton)
      // Hoặc có thể set loading=true nếu muốn hiện skeleton lại
      // Ở đây mình giữ nguyên loading cho lần đầu, còn refresh thì UI tự lo spinner
      
      const data = await productApi.getCategories();

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error("API không trả về danh sách danh mục hợp lệ:", data);
        setCategories([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục:", err);
      setCategories([]);
    } finally {
      // 3. Luôn tắt loading khi xong việc (dù thành công hay thất bại)
      setLoading(false);
    }
  }, []);

  // Gọi API lần đầu khi component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 4. Return về Object thay vì Array
  return { 
    categories, 
    loading, 
    refreshCategories: fetchCategories 
  };
}