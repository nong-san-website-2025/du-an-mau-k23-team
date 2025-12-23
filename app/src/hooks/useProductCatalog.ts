// src/hooks/useProductCatalog.ts
import { useState, useEffect} from 'react';
import { productApi } from '../api/productApi';
import { Product } from '../types/models';

export const useProductCatalog = (itemsPerLoad = 12) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch data (Nên handle server-side pagination thực tế sau này)
  const fetchProducts = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await productApi.getAllProducts();
      setAllProducts(data);
      setDisplayedProducts(data.slice(0, itemsPerLoad));
      setHasMore(data.length > itemsPerLoad);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Logic search và pagination tách biệt
  const filterProducts = (term: string) => {
    if (!term) {
      setDisplayedProducts(allProducts.slice(0, itemsPerLoad));
      setHasMore(allProducts.length > itemsPerLoad);
      return;
    }
    const lower = term.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(lower) || p.brand?.toLowerCase().includes(lower)
    );
    setDisplayedProducts(filtered);
    setHasMore(false);
  };

  const loadMore = () => {
    const currentLen = displayedProducts.length;
    const nextBatch = allProducts.slice(currentLen, currentLen + itemsPerLoad);
    if (nextBatch.length > 0) {
      setDisplayedProducts(prev => [...prev, ...nextBatch]);
    } else {
      setHasMore(false);
    }
  };

  return {
    products: displayedProducts,
    loading,
    error,
    hasMore,
    refetch: fetchProducts,
    search: filterProducts,
    loadMore
  };
};