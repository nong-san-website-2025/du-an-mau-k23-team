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

  // --- 1. LOCAL STATE (Quản lý giá trị ô input để gõ mượt mà) ---
  const [localValue, setLocalValue] = useState(search || "");

  // --- 2. SYNC TỪ PARENT (Khi URL thay đổi hoặc F5) ---
  useEffect(() => {
    setLocalValue(search || "");
  }, [search]);

  // --- 3. DEBOUNCE LOGIC (Chờ 300ms mới gọi API) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      // Chỉ gọi ra Parent nếu giá trị thay đổi so với prop 'search' hiện tại
      // và khác rỗng (hoặc tùy logic bạn muốn)
      if (localValue !== search) {
        // Giả lập event object vì handleSearchChange ở Parent đang mong đợi 'e.target.value'
        handleSearchChange({ target: { value: localValue } });
      }
    }, 300);

    // Clear timeout nếu user gõ tiếp trong khoảng 300ms
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
    // Lưu tối đa 5 item mới nhất, không trùng lặp
    let newHistory = [keyword, ...history.filter((h) => h !== keyword)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  // --- 6. HANDLER: KHI CHỌN TỪ KHÓA (CLICK HOẶC ENTER) ---
  const handleSelectKeyword = (keyword) => {
    setLocalValue(keyword); // Cập nhật UI ngay lập tức
    setSearch(keyword);     // Cập nhật Parent ngay (bỏ qua debounce)
    
    saveSearchHistory(keyword);
    setShowSuggestions(false);
    
    // Điều hướng sang trang search full
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
    inputRef.current?.blur();
  };

  // --- 7. HANDLER: KHI CLICK VÀO SẢN PHẨM GỢI Ý ---
  const handleProductClick = (product) => {
    saveSearchHistory(product.name);
    navigate(`/products/${product.id}`);
    setShowSuggestions(false);
  };

  // --- 8. HANDLER: KHI CLICK VÀO DANH MỤC GỢI Ý ---
  const handleCategoryClick = (categorySlug) => {
    navigate(`/category/${categorySlug}`);
    setShowSuggestions(false);
  };

  // --- 9. HANDLER: XÓA LỊCH SỬ ---
  const clearHistory = (e) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // --- 10. MEMOIZE DATA HIỂN THỊ ---
  const { categories, products } = useMemo(
    () => ({
      categories: (searchResults?.categories || []).slice(0, 3),
      products: (searchResults?.products || []).slice(0, 5),
    }),
    [searchResults]
  );

  const hasResults = products.length > 0 || categories.length > 0;
  
  // Quan trọng: Dùng localValue để xác định trạng thái "Đang gõ" cho UI mượt
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
          
          // Binding vào localValue để hiển thị tức thì
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSelectKeyword(localValue)}
        />
        
        {/* NÚT SEARCH ICON */}
        <button
          className="search-btn"
          onClick={() => handleSelectKeyword(localValue)}
        >
          <Search size={20} color="white" />
        </button>

        {/* --- PHẦN DROPDOWN GỢI Ý --- */}
        {showSuggestions && (
          <div className="search-dropdown">
            
            {/* TRƯỜNG HỢP 1: CHƯA GÕ GÌ -> HIỆN LỊCH SỬ */}
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

            {/* TRƯỜNG HỢP 2: ĐANG GÕ -> HIỆN KẾT QUẢ GỢI Ý */}
            {isTyping && (
              <>
                {/* Gợi ý Danh mục */}
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

                {/* Gợi ý Sản phẩm */}
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
                        {/* Nếu có ảnh thì bỏ comment dòng dưới */}
                        {/* <img src={product.image} className="product-thumb" alt="" /> */}
                        
                        <div className="product-info">
                          <div
                            className="product-name"
                            dangerouslySetInnerHTML={{
                              __html: product.highlighted_name || product.name,
                            }}
                          />
                          {/* Hiển thị giá nếu cần */}
                          {/* <div className="product-price">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                          </div> */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Không tìm thấy kết quả */}
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