import { useState, useEffect } from 'react';
import { productApi } from '../services/productApi';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.getAllProducts();
      setProducts(Array.isArray(data) ? data : []); // Ensure it's an array
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Only run once on mount

  return { products, loading, error, refetch: fetchProducts };
};

// Tạm thời comment out các hook này vì chưa implement đầy đủ API
// export const useCategories = () => {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const data = await productApi.getCategories();
//         setCategories(data.results || data);
//       } catch (err) {
//         setError(err.message);
//         console.error('Error fetching categories:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCategories();
//   }, []);

//   return { categories, loading, error };
// };

// export const useCategoryProducts = (categoryKey, subcategory = null) => {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchCategoryProducts = async () => {
//       if (!categoryKey) return;
      
//       try {
//         setLoading(true);
//         setError(null);
//         const filters = { category: categoryKey };
//         if (subcategory) {
//           filters.subcategory = subcategory;
//         }
//         const data = await productApi.getAllProducts();
//         setProducts(data.results || data);
//       } catch (err) {
//         setError(err.message);
//         console.error('Error fetching category products:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCategoryProducts();
//   }, [categoryKey, subcategory]);

//   return { products, loading, error };
// };