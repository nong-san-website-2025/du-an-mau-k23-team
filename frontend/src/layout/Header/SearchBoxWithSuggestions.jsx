import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom"; // ✅ Import Link
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

  // --- 1. LOCAL STATE ---
  const [localValue, setLocalValue] = useState(search || "");

  // --- 2. SYNC TỪ PARENT ---
  useEffect(() => {
    setLocalValue(search || "");
  }, [search]);

  // --- 3. DEBOUNCE LOGIC ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== search) {
        handleSearchChange({ target: { value: localValue } });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, search, handleSearchChange]);

  // --- 4. LOAD HISTORY ---
  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("searchHistory") || "[]"
    );
    setHistory(savedHistory);
  }, []);

  // --- 5. HELPER: LƯU HISTORY ---
  const saveSearchHistory = (keyword) => {
    if (!keyword || !keyword.trim()) return;
    let newHistory = [keyword, ...history.filter((h) => h !== keyword)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // --- 6. HANDLER: KHI ENTER HOẶC CLICK SEARCH ---
  const handleSelectKeyword = (keyword) => {
    if (!keyword) return;
    setLocalValue(keyword);
    setSearch(keyword);
    saveSearchHistory(keyword);
    setShowSuggestions(false);
    navigate(`/search?query=${encodeURIComponent(keyword)}`); // ✅ Đảm bảo param là query hoặc q tùy backend
    inputRef.current?.blur();
  };

  // --- 7. HANDLER: XÓA LỊCH SỬ ---
  const clearHistory = (e) => {
    e.preventDefault(); // Ngăn Link nếu có
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const handleCategoryClick = (categorySlug) => {
    // encodeURIComponent để đảm bảo slug không bị lỗi ký tự đặc biệt
    navigate(`/products?category=${categorySlug}`);
    setShowSuggestions(false);
  };

  // --- 8. MEMOIZE DATA ---
  const { categories, products } = useMemo(
    () => ({
      categories: (searchResults?.categories || []).slice(0, 3),
      products: (searchResults?.products || []).slice(0, 5),
    }),
    [searchResults]
  );

  const hasResults = products.length > 0 || categories.length > 0;
  const isTyping = localValue.trim().length > 0;

  return (
    <div className="search-container" ref={containerRef}>
      <div className={`search-input-wrapper ${showSuggestions ? "active" : ""}`}>

        {/* INPUT CHÍNH */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Tìm sản phẩm, thương hiệu..."
          className="search-input"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSelectKeyword(localValue)}
        />

        <button
          className="search-btn"
          onClick={() => handleSelectKeyword(localValue)}
        >
          <Search size={20} color="white" />
        </button>

        {/* --- DROPDOWN GỢI Ý --- */}
        {showSuggestions && (
          <div className="search-dropdown">

            {/* 1. LỊCH SỬ TÌM KIẾM */}
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

            {/* 2. KẾT QUẢ GỢI Ý */}
            {isTyping && (
              <>
                {/* --- GỢI Ý DANH MỤC (Dùng Link giống CategorySection) --- */}
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

                {/* --- GỢI Ý SẢN PHẨM (Dùng Link) --- */}
                {products.length > 0 && (
                  <div className="search-section">
                    <div className="section-title d-flex">
                      <Package size={14} className="icon-green" />
                      <div className="section-label">SẢN PHẨM GỢI Ý</div>
                    </div>
                    {products.map((product) => (
                      <Link
                        key={product.id}
                        // ✅ SỬA LẠI: Trỏ về trang chi tiết sản phẩm chuẩn
                        to={`/products/${product.id}`}
                        className="product-item text-decoration-none"
                        onClick={() => {
                          saveSearchHistory(product.name);
                          setShowSuggestions(false);
                        }}
                      >
                        {/* <img src={product.image} className="product-thumb" alt="" /> */}
                        <div className="product-info">
                          <div
                            className="product-name"
                            dangerouslySetInnerHTML={{
                              __html: product.highlighted_name || product.name,
                            }}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* --- KHÔNG CÓ KẾT QUẢ --- */}
                {!hasResults && (
                  <div className="no-results">
                    <div className="no-res-icon">🔍</div>
                    <p>
                      Không tìm thấy kết quả cho "<strong>{localValue}</strong>"
                    </p>
                    <span>Thử tìm từ khóa khác xem sao nhé</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}