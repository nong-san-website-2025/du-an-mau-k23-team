import { useState, useEffect } from "react";
import { productApi } from "../../features/products/services/productApi";

export default function useFetchCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productApi.getCategoriesWithProducts();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  return categories;
}
