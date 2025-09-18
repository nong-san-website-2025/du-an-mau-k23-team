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

  // Khi nhấn Enter trong ô input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchClick();
    }
  };

  return (
    <div
      className="position-relative me-0 d-none d-md-block"
      ref={containerRef}
      style={{ zIndex: 3000 }}
    >
      {/* Nút search */}
      <div>
        <button
          className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
          style={{
            right: 10,
            color: "#16a34a",
            backgroundColor: "#4CAF50",
            padding: "3px 16px",
            borderRadius: "4px ",
            margin: "1px 3px 1px 1px"
          }}
          onClick={handleSearchClick} // ✅ Sửa thành hàm handleSearchClick
        >
          <Search size={24} style={{ color: "#FFFFFF" }} />
        </button>

        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm ..."
          className="form-control ps-3 pe-5"
          style={{ width: 700, height: 40, fontSize: 16, fontFamily: "Roboto" }}
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
      {showSuggestions &&
        (searchResults.products.length > 0 ||
          searchResults.posts.length > 0) && (
          <div
            className="shadow-lg bg-white rounded position-absolute mt-2"
            style={{
              left: 0,
              top: "100%",
              minWidth: 300,
              maxWidth: 400,
              zIndex: 3000,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              padding: 16,
            }}
          >
            {searchResults.products.length > 0 && (
              <div>
                <strong style={{ color: "#16a34a" }}>Sản phẩm</strong>
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {searchResults.products.map((product) => (
                    <li key={product.id} style={{ padding: "6px 0" }}>
                      <Link
                        to={`/products/${product.id}`}
                        style={{ color: "#333", textDecoration: "none" }}
                      >
                        {product.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searchResults.posts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong style={{ color: "#16a34a" }}>Bài viết</strong>
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {searchResults.posts.map((post) => (
                    <li key={post.id} style={{ padding: "6px 0" }}>
                      <Link
                        to={`/blog/${post.title}`}
                        style={{ color: "#333", textDecoration: "none" }}
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
