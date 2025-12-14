import { useEffect, useState } from "react";
import { productApi } from "../api/productApi"; // ⚠️ chỉnh lại đường dẫn nếu cần

export interface Subcategory {
  id: number;
  name: string;
  image?: string;
}

export default function useSubcategories(categoryId?: number | string) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return; // chưa có id thì không fetch

    const fetchSubcategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await productApi.getSubcategories(Number(categoryId));

        // Kiểm tra nếu dữ liệu đúng định dạng mảng
        if (Array.isArray(data)) {
          setSubcategories(data);
        } else {
          console.warn("⚠️ Dữ liệu trả về không hợp lệ:", data);
          setSubcategories([]);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải danh mục con:", err);

        // ép kiểu err về Error nếu có message
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Không thể tải danh mục con.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [categoryId]);

  return { subcategories, loading, error };
}
