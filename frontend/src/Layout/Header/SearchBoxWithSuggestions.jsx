import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Search, FolderOpen, Store } from "lucide-react";

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

  useEffect(() => {
    const saved = localStorage.getItem("searchValue");
    if (saved) setSearch(saved);
  }, [setSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef, setShowSuggestions]);

  const handleSearchClick = () => {
    if (!search.trim()) return;

    localStorage.setItem("searchValue", search);
    logSearchKeyword(search); // ✅ Dùng lại hàm

    handleSearchSubmit(search);
    navigate(`/search?query=${encodeURIComponent(search)}`);
    setShowSuggestions(false);
  };

  const logSearchKeyword = (keyword) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch("/api/search/search-log/", {
      method: "POST",
      headers: headers,
      credentials: "include",
      body: JSON.stringify({ keyword: keyword.trim() }),
    })
      .then((res) => res.json())
      .then((data) => console.log("📊 Search log response:", data))
      .catch((err) => console.error("❌ Search log error:", err));
  };

  const filteredProducts = (searchResults?.products || []).slice(0, 5);

  const filteredCategories = (searchResults?.categories || []).slice(0, 3);
  const filteredSellers = (searchResults?.sellers || []).slice(0, 3);

  const totalResults = searchResults?.products?.length || 0;
  const hasResults =
    filteredProducts.length > 0 ||
    filteredCategories.length > 0 ||
    filteredSellers.length > 0;

  return (
    <div
      className="position-relative"
      ref={containerRef}
      style={{ zIndex: 3000 }}
    >
      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm, danh mục, cửa hàng..."
          className="form-control"
          style={{
            width: "100%",
            maxWidth: 700,
            minWidth: 250,
            height: 42,
            fontSize: 15,
            borderRadius: 21,
            border: "2px solid rgba(255,255,255,0.3)",
            paddingLeft: 20,
            paddingRight: 50,
            backgroundColor: "rgba(255,255,255,0.95)",
            transition: "all 0.2s ease",
            boxShadow: showSuggestions
              ? "0 4px 12px rgba(0,0,0,0.15)"
              : "0 2px 8px rgba(0,0,0,0.1)",
          }}
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearchClick();
            }
          }}
        />
        <button
          onClick={handleSearchClick}
          style={{
            position: "absolute",
            right: 4,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "#4CAF50",
            border: "none",
            borderRadius: 17,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(76,175,80,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#45a049";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4CAF50";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          <Search size={18} color="white" />
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && search.trim() && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 8px)",
            width: "100%",
            maxWidth: 700,
            backgroundColor: "white",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            border: "1px solid rgba(0,0,0,0.06)",
            overflow: "hidden",
            zIndex: 3000,
          }}
        >
          {/* Category Results */}
          {filteredCategories.length > 0 && (
            <div>
              <div
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FolderOpen size={16} color="#0040d4ff" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Danh mục
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  {filteredCategories.length} kết quả
                </span>
              </div>

              <div>
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const keyword = category.name;
                      logSearchKeyword(keyword); // ✅ Ghi log
                      navigate(
                        `/products?category=${encodeURIComponent(keyword)}`
                      );
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: "4px 20px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f5f5f5",
                      transition: "background-color 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f8ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: "#1a1a1a",
                          marginBottom: 2,
                        }}
                      >
                        {category.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller Results */}
          {filteredSellers.length > 0 && (
            <div>
              <div
                style={{
                  padding: "4px 20px",
                  backgroundColor: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Store size={16} color="#FFC107" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Cửa hàng
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  {filteredSellers.length} kết quả
                </span>
              </div>

              <div>
                {filteredSellers.map((seller) => (
                  <div
                    key={seller.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const keyword = seller.name || seller.shop_name;
                      logSearchKeyword(keyword); // ✅ Ghi log
                      navigate(`/store/${seller.id}`);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: "4px 20px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f5f5f5",
                      transition: "background-color 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff8f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: "#1a1a1a",
                          marginBottom: 2,
                        }}
                      >
                        {seller.name || seller.shop_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Results */}
          {filteredProducts.length > 0 && (
            <div>
              <div
                style={{
                  padding: "4px 20px",
                  backgroundColor: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Package size={16} color="#4CAF50" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Sản phẩm
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  {filteredProducts.length} kết quả
                </span>
              </div>

              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const keyword = product.name;
                      logSearchKeyword(keyword); // ✅ Ghi log
                      navigate(`/products/${product.id}`);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: "4px 20px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f5f5f5",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#A5D6A7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 14,
                        color: "#1a1a1a",
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {product.name}
                    </div>
                  </div>
                ))}
              </div>

              {totalResults > 5 && (
                <div
                  style={{
                    padding: "12px 20px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "#4CAF50",
                    fontWeight: 500,
                    cursor: "pointer",
                    borderTop: "1px solid #f0f0f0",
                    backgroundColor: "#fafafa",
                  }}
                  onClick={handleSearchClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8f5e9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fafafa";
                  }}
                >
                  Xem tất cả {totalResults} kết quả
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!hasResults && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#999",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#666" }}>
                Không tìm thấy kết quả
              </div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                Thử tìm kiếm với từ khóa khác
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
