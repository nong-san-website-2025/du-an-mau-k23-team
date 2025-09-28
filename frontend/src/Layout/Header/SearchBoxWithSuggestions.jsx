import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBoxWithSuggestions({
  search,
  setSearch,
  setShowSuggestions,
  showSuggestions,
  searchResults,
  handleSearchChange,
  handleSearchSubmit,
  greenText,
  containerRef,
}) {
  const navigate = useNavigate();

  // Load giá trị search từ localStorage khi component mount
  useEffect(() => {
    const savedSearch = localStorage.getItem("searchValue");
    if (savedSearch) {
      setSearch(savedSearch);
    }
  }, [setSearch]);

  // Hàm khi click nút search
  const handleSearchClick = () => {
    if (!search.trim()) return;

    // Lưu giá trị search vào localStorage
    localStorage.setItem("searchValue", search);

    // Thực hiện tìm kiếm
    handleSearchSubmit(search);

    // Điều hướng đến trang kết quả tìm kiếm
    navigate(`/search?query=${encodeURIComponent(search)}`);
  };

  // Bộ lọc thông minh - chỉ loại bỏ kết quả không liên quan
  const smartFilter = (items, query, type = 'product') => {
    if (!query) return [];
    
    const queryLower = query.toLowerCase().trim();
    const results = [];

    for (const item of items) {
      let textToSearch = '';
      
      if (type === 'product') {
        textToSearch = `${item.name || ''} ${item.description || ''}`;
      } else {
        textToSearch = `${item.title || ''} ${item.content || ''} ${item.excerpt || ''}`;
      }
      
      const textLower = textToSearch.toLowerCase();
      
      // Kiểm tra xem từ khóa có thực sự tồn tại trong văn bản không
      if (textLower.includes(queryLower)) {
        // Tính điểm độ liên quan
        const relevanceScore = calculateRelevance(item, queryLower, textLower);
        results.push({ ...item, relevanceScore });
      }
    }

    // Sắp xếp theo độ liên quan và giới hạn kết quả
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
      .map(({ relevanceScore, ...item }) => item);
  };

  // Hàm tính độ liên quan
  const calculateRelevance = (item, query, text) => {
    let score = 0;
    
    // Ưu tiên tên sản phẩm/bài viết
    const name = item.name || item.title || '';
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes(query)) {
      score += 100; // Rất liên quan nếu tên chứa từ khóa
    }
    
    // Ưu tiên từ khóa nguyên vẹn
    if (text.includes(query)) {
      score += 50;
    }
    
    // Trừ điểm nếu từ khóa quá ngắn và kết quả quá dài
    if (query.length < 3 && text.length > 50) {
      // Nhưng vẫn cho qua nếu từ khóa nằm trong tên
      if (nameLower.includes(query)) {
        score += 20; // Bù lại điểm nếu từ khóa trong tên
      } else {
        score -= 30; // Tránh kết quả quá rộng nếu không ở tên
      }
    }
    
    return score;
  };

  // Áp dụng bộ lọc
  const filteredProducts = smartFilter(searchResults.products, search, 'product');

  return (
    <div
      className="position-relative me-0 d-none d-md-block"
      ref={containerRef}
      style={{ zIndex: 3000 }}
    >
      {/* Nút search */}
      <div style={{ position: "relative" }}>
        <button
          className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
          style={{
            right: 10,
            color: "#16a34a",
            backgroundColor: "#4CAF50",
            padding: "3px 16px",
            borderRadius: "4px",
            margin: "1px 3px 1px 1px",
            border: "none",
            cursor: "pointer",
          }}
          onClick={handleSearchClick}
        >
          <Search size={24} style={{ color: "#FFFFFF" }} />
        </button>

        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm ..."
          className="form-control ps-3 pe-5"
          style={{ 
            width: 700, 
            height: 40, 
            fontSize: 16, 
            fontFamily: "Roboto",
            borderRadius: "8px",
            border: "1px solid #ddd",
            paddingLeft: "16px"
          }}
          value={search}
          onChange={handleSearchChange}
          onFocus={() => search && setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearchSubmit(); // Nhấn Enter để search
            }
          }}
        />
      </div>

      {/* Danh sách gợi ý */}
      {showSuggestions && (
        (filteredProducts.length > 0 ) && (
          <div
            className="shadow-lg bg-white rounded position-absolute mt-2"
            style={{
              left: 0,
              top: "100%",
              minWidth: 700,
              maxWidth: 1200,
              zIndex: 3000,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              padding: "16px",
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #e0e0e0",
            }}
          >
            {filteredProducts.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "8px",
                  paddingBottom: "4px",
                  borderBottom: "1px solid #eee"
                }}>
                  <strong style={{ color: "#16a34a", fontSize: "14px" }}>
                    Sản phẩm ({filteredProducts.length})
                  </strong>
                </div>
                <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                  {filteredProducts.map((product) => (
                    <li 
                      key={product.id} 
                      style={{ 
                        padding: "8px 12px", 
                        borderRadius: "6px",
                        marginBottom: "4px",
                        transition: "background-color 0.2s",
                        cursor: "pointer",
                        border: "1px solid #f0f0f0"
                      }}
                      onMouseDown={() => {
                        // Sử dụng onMouseDown để tránh lỗi khi mất focus
                        navigate(`/products/${product.id}`);
                        setShowSuggestions(false);
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 500, 
                            color: "#333", 
                            fontSize: "14px",
                            lineHeight: 1.4
                          }}>
                            {product.name}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "#666",
                            marginTop: "2px",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}>
                            {product.description || "Không có mô tả"}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            {/* Hiển thị thông báo nếu có kết quả bị ẩn */}
            {searchResults.products.length > 5 && (
              <div style={{ 
                textAlign: "center", 
                padding: "8px 0", 
                fontSize: "12px", 
                color: "#999",
                borderTop: "1px solid #eee",
                marginTop: "8px"
              }}>
                +{searchResults.products.length - 5} sản phẩm khác...
              </div>
            )} 
          </div>
        )
      )}
    </div>
  );
}