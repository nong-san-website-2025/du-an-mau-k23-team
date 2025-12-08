import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, FolderOpen, Clock, X, ArrowUpLeft } from "lucide-react";
import "../styles/css/SearchBox.css"; // File CSS ở phần dưới

// Helper: Highlight text khớp với từ khóa (UX Feature)
const HighlightText = ({ text = "", highlight = "" }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={index} className="search-highlight">{part}</span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function SearchBoxWithSuggestions({
  search,
  setSearch,
  setShowSuggestions,
  showSuggestions,
  searchResults,
  handleSearchChange,
  handleSearchSubmit,
  containerRef,
}) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const shouldShowDropdown = showSuggestions && (search.trim().length > 0 || history.length > 0);

  // Load lịch sử từ LocalStorage khi mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setHistory(savedHistory);

    // Check saved last search value if needed (optional)
    const savedValue = localStorage.getItem("searchValue");
    if (savedValue && !search) setSearch(savedValue);
  }, []);

  // Xử lý Click Outside chuyên nghiệp hơn
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef, setShowSuggestions]);

  // Logic ghi log và lưu history
  const saveSearchHistory = (keyword) => {
    if (!keyword.trim()) return;

    // Lưu vào LocalStorage (UI)
    let newHistory = [keyword, ...history.filter((h) => h !== keyword)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    localStorage.setItem("searchValue", keyword);

    // Gửi Log lên Server (Logic tách biệt)
    logSearchKeyword(keyword);
  };

  const handleSelectKeyword = (keyword) => {
    setSearch(keyword);
    saveSearchHistory(keyword);
    handleSearchSubmit(keyword);
    navigate(`/search?query=${encodeURIComponent(keyword)}`);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleProductClick = (product) => {
    saveSearchHistory(product.name); // Vẫn lưu lịch sử dù click sản phẩm
    navigate(`/products/${product.id}`);
    setShowSuggestions(false);
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // API Log (Tách ra để dễ tái sử dụng hoặc đưa vào services)
  const logSearchKeyword = async (keyword) => {
    try {
      const token = localStorage.getItem("access_token"); // Chỉ cần lấy 1 key chuẩn
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/search/search-log/", {
        method: "POST",
        headers,
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
    } catch (err) {
      console.error("Log search error:", err);
    }
  };

  // Memoize data để tránh render lại không cần thiết
  const { categories, products, total } = useMemo(() => ({
    categories: (searchResults?.categories || []).slice(0, 3),
    products: (searchResults?.products || []).slice(0, 5),
    total: searchResults?.products?.length || 0
  }), [searchResults]);

  const hasResults = products.length > 0 || categories.length > 0;
  const isTyping = search.trim().length > 0;

  return (
    <div className="search-container" ref={containerRef}>
      {/* Input Group */}
      <div className={`search-input-wrapper ${showSuggestions ? "active" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Tìm sản phẩm, thương hiệu..."
          className="search-input"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSelectKeyword(search)}
        />
        <button className="search-btn" onClick={() => handleSelectKeyword(search)}>
          <Search size={20} color="white" />
        </button>
      </div>

      {/* Dropdown Suggestions */}
      {showSuggestions && (
        <div className="search-dropdown">

          {/* CASE 1: Chưa nhập gì -> Hiện Lịch sử tìm kiếm (Best Practice UX) */}
          {!isTyping && (
            <div className="search-section">
              <div className="section-header">
                <span>Lịch sử tìm kiếm</span>
                <span className="clear-history" onClick={clearHistory}>Xóa</span>
              </div>
              <div className="history-list">
                {history.map((item, idx) => (
                  <div key={idx} className="history-item" onClick={() => handleSelectKeyword(item)}>
                    <Clock size={14} className="icon-grey" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CASE 2: Đang nhập -> Hiện kết quả gợi ý */}
          {isTyping && (
            <>
              {/* Danh mục */}
              {categories.length > 0 && (
                <div className="search-section">
                  <div className="section-title">
                    <FolderOpen size={14} className="icon-blue" />
                    DANH MỤC
                  </div>
                  {categories.map((cat) => (
                    <div key={cat.id} className="suggestion-item" onClick={() => handleSelectKeyword(cat.name)}>
                      <span>Tìm trong danh mục <span className="highlight-cat">{cat.name}</span></span>
                      <ArrowUpLeft size={14} className="icon-jump" />
                    </div>
                  ))}
                </div>
              )}

              {/* Sản phẩm */}
              {products.length > 0 && (
                <div className="search-section">
                  <div className="section-title">
                    <Package size={14} className="icon-green" />
                    SẢN PHẨM GỢI Ý
                  </div>
                  {products.map((product) => (
                    <div key={product.id} className="product-item" onClick={() => handleProductClick(product)}>
                      <div className="product-info">
                        <div className="product-name">
                          <HighlightText text={product.name} highlight={search} />
                        </div>
                        {/* Nếu có giá, hiển thị ở đây sẽ rất tốt */}
                        {product.price && <div className="product-price">{product.price.toLocaleString()}đ</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View All */}
              {total > 5 && (
                <div className="view-all-btn" onClick={() => handleSelectKeyword(search)}>
                  Xem thêm {total - 5} sản phẩm
                </div>
              )}

              {/* No Results */}
              {!hasResults && (
                <div className="no-results">
                  <div className="no-res-icon">🔍</div>
                  <p>Không tìm thấy kết quả cho "<strong>{search}</strong>"</p>
                  <span>Hãy thử từ khóa khác xem sao nhé</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}