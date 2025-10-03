// src/hooks/useCategories.js
import { useState, useEffect } from "react";
import { productApi } from "../../features/products/services/productApi";

export default function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productApi.getCategoriesWithProducts();
        setCategories(data);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  return categories;
}
