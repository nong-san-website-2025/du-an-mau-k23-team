import { useState, useEffect, useMemo } from 'react';
import { removeVietnameseAccents } from '../utils/productUtils';

export const useProductFilters = (products, categories, options = {}) => {
  const {
    enableAccentRemoval = false,
    pageSize = 16,
  } = options;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredByCategory = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category_name === selectedCategory);
  }, [products, selectedCategory]);

  const uniqueBrands = useMemo(() => {
    const set = new Set();
    filteredByCategory.forEach((p) => p.brand && set.add(p.brand.trim()));
    return Array.from(set).sort();
  }, [filteredByCategory]);

  const uniqueLocations = useMemo(() => {
    const set = new Set();
    filteredByCategory.forEach((p) => p.location && set.add(p.location.trim()));
    return Array.from(set).sort();
  }, [filteredByCategory]);

  const subcategoriesForSelected = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = categories.find((c) => c.name === selectedCategory);
    return cat?.subcategories || [];
  }, [categories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (selectedSubcategory) {
      console.log("Filtering with subcategory:", selectedSubcategory);
      console.log("Sample product subcategory_name:", products[0]?.subcategory_name);
    }
    return products.filter((p) => {
      const matchCategory = !selectedCategory || p.category_name === selectedCategory;
      const matchSubcategory = !selectedSubcategory || p.subcategory_name === selectedSubcategory;
      const matchBrand = !selectedBrand || p.brand === selectedBrand;
      const matchLocation = !selectedLocation || p.location === selectedLocation;
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];

      let matchSearch = true;
      if (search) {
        const searchValue = enableAccentRemoval 
          ? removeVietnameseAccents(search.toLowerCase())
          : search.toLowerCase();
        const productName = enableAccentRemoval
          ? removeVietnameseAccents(p.name.toLowerCase())
          : p.name.toLowerCase();
        matchSearch = productName.includes(searchValue);
      }

      return matchCategory && matchSubcategory && matchBrand && matchLocation && matchPrice && matchSearch;
    });
  }, [products, selectedCategory, selectedSubcategory, selectedBrand, selectedLocation, priceRange, search, enableAccentRemoval]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSubcategory, selectedBrand, selectedLocation, priceRange]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrand('');
    setSelectedLocation('');
    setPriceRange([0, 1000000]);
    setCurrentPage(1);
  };

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    selectedBrand,
    setSelectedBrand,
    selectedLocation,
    setSelectedLocation,
    priceRange,
    setPriceRange,
    currentPage,
    setCurrentPage,
    uniqueBrands,
    uniqueLocations,
    subcategoriesForSelected,
    filteredProducts,
    paginatedProducts,
    resetFilters,
    totalItems: filteredProducts.length,
    pageSize,
  };
};
