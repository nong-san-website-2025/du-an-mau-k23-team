import { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../../features/admin/services/axiosInstance";
import { debounce } from "lodash"; // Import debounce

export default function useSearch() {
  const [search, setSearch] = useState("");
  
  // Cập nhật State khởi tạo khớp với cấu trúc trả về từ Meilisearch Backend
  const [results, setResults] = useState({ 
    products: [], 
    shops: [], 
    categories: [] 
  });
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef();

  // 1. Logic đóng dropdown khi click ra ngoài (Giữ nguyên)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // 2. Tạo hàm fetch API có Debounce (Chờ 300ms sau khi ngừng gõ mới gọi)
  // Sử dụng useCallback để không bị tạo lại hàm mới mỗi lần render
  const debouncedFetch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) return;

      try {
        // Gọi API mới: smart-search
        const res = await axiosInstance.get(`/products/smart-search/`, {
          params: { q: query },
        });
        
        // Backend trả về: { products: [], shops: [], categories: [] }
        setResults(res.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Search error:", error);
        // Nếu lỗi, reset về rỗng
        setResults({ products: [], shops: [], categories: [] }); 
      }
    }, 300), 
    [] // Empty dependency: Hàm này chỉ khởi tạo 1 lần
  );

  // 3. Handle Change: Cập nhật UI ngay lập tức, nhưng hoãn gọi API
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Nếu ô tìm kiếm rỗng
    if (value.trim() === "") {
      setResults({ products: [], shops: [], categories: [] });
      setShowSuggestions(false);
      debouncedFetch.cancel(); // Hủy các request đang chờ (nếu có)
      return;
    }

    // Gọi hàm debounce
    debouncedFetch(value);
  };

  // 4. Cleanup debounce khi component unmount (tránh memory leak)
  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  return {
    search,
    setSearch,

    // Dữ liệu trả về (Format mới)
    results,
    // Giữ alias cũ để tương thích với code cũ của bạn
    searchResults: results,

    showSuggestions,
    setShowSuggestions,

    containerRef,
    searchRef: containerRef,

    handleSearchChange,
  };
}