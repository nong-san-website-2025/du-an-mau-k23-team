import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  FolderOpen,
  Clock,
  ArrowUpLeft,
} from "lucide-react";
import "../styles/SearchBox.css";

export default function SearchBoxWithSuggestions({
  search,
  setSearch,
  showSuggestions,
  setShowSuggestions,
  searchResults,
  handleSearchChange,
  containerRef,
}) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  // 1. Load History
  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("searchHistory") || "[]"
    );
    setHistory(savedHistory);
  }, []);

  // 2. Save History
  const saveSearchHistory = (keyword) => {
    if (!keyword || !keyword.trim()) return;
    let newHistory = [keyword, ...history.filter((h) => h !== keyword)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // 3. Handlers
  const handleSelectKeyword = (keyword) => {
    setSearch(keyword);
    saveSearchHistory(keyword);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
    inputRef.current?.blur();
  };

  const handleProductClick = (product) => {
    saveSearchHistory(product.name);
    navigate(`/products/${product.id}`);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (categorySlug) => {
    navigate(`/category/${categorySlug}`);
    setShowSuggestions(false);
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // 4. Memoize Data
  const { categories, products } = useMemo(
    () => ({
      categories: (searchResults?.categories || []).slice(0, 3),
      products: (searchResults?.products || []).slice(0, 5),
    }),
    [searchResults]
  );

  const hasResults = products.length > 0 || categories.length > 0;
  const isTyping = search.trim().length > 0;

  return (
    <div className="search-container" ref={containerRef}>
      {/* QUAN TRỌNG: 
         Dropdown bây giờ nằm BÊN TRONG thẻ .search-input-wrapper.
         Vì wrapper có position: relative, dropdown absolute sẽ lấy chiều rộng theo wrapper.
      */}
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
        <button
          className="search-btn"
          onClick={() => handleSelectKeyword(search)}
        >
          <Search size={20} color="white" />
        </button>

        {/* --- KHỐI DROPDOWN BẮT ĐẦU TẠI ĐÂY --- */}
        {showSuggestions && (
          <div className="search-dropdown">
            
            {/* CASE 1: Lịch sử */}
            {!isTyping && history.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <span>Lịch sử tìm kiếm</span>
                  <span className="clear-history" onClick={clearHistory}>
                    Xóa
                  </span>
                </div>
                <div className="history-list">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="history-item"
                      onClick={() => handleSelectKeyword(item)}
                    >
                      <Clock size={14} className="icon-grey" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CASE 2: Kết quả tìm kiếm */}
            {isTyping && (
              <>
                {/* SECTION: Categories */}
                {categories.length > 0 && (
                  <div className="search-section">
                    <div className="section-title d-flex">
                      <FolderOpen size={14} className="icon-blue" />
                      <div className="section-label">DANH MỤC</div>
                    </div>
                    {categories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="suggestion-item"
                        onClick={() => handleCategoryClick(cat.slug)}
                      >
                        <span>
                          <strong className="highlight-text">{cat.name}</strong>
                        </span>
                        <ArrowUpLeft size={14} className="icon-jump" />
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION: Products */}
                {products.length > 0 && (
                  <div className="search-section">
                    <div className="section-title d-flex">
                      <Package size={14} className="icon-green" />
                      <div className="section-label">SẢN PHẨM GỢI Ý</div>
                    </div>
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="product-item"
                        onClick={() => handleProductClick(product)}
                      >
                        {/* Lưu ý: Nếu có ảnh product.image thì thêm thẻ img vào đây */}
                         {/* <img src={product.image} className="product-thumb" alt="" /> */}
                        <div className="product-info">
                          <div
                            className="product-name"
                            dangerouslySetInnerHTML={{
                              __html: product.highlighted_name || product.name,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!hasResults && (
                  <div className="no-results">
                    <div className="no-res-icon">🔍</div>
                    <p>
                      Không tìm thấy kết quả cho "<strong>{search}</strong>"
                    </p>
                    <span>Thử tìm từ khóa khác xem sao nhé</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {/* --- KHỐI DROPDOWN KẾT THÚC TẠI ĐÂY --- */}

      </div>
    </div>
  );
}