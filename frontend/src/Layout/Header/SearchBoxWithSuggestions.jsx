import React from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBoxWithSuggestions({
  search,
  setShowSuggestions,
  showSuggestions,
  searchResults,
  handleSearchChange,
  greenText,
  containerRef,
}) {
  return (
    <div className="position-relative me-3 d-none d-md-block" ref={containerRef} style={{ zIndex: 3000 }}>
      <input
        type="text"
        placeholder="Tìm kiếm sản phẩm hoặc bài viết..."
        className="form-control rounded-pill ps-3 pe-5"
        style={{ width: 290, minWidth: 150, fontSize: 14, fontStyle: "italic" }}
        value={search}
        onChange={handleSearchChange}
        onFocus={() => search && setShowSuggestions(true)}
      />
      <button className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0" style={{ right: 10, color: "#16a34a" }}>
        <Search size={18} style={greenText} />
      </button>
      {showSuggestions && (searchResults.products.length > 0 || searchResults.posts.length > 0) && (
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
                    <Link to={`/products/${product.id}`} style={{ color: "#333", textDecoration: "none" }}>
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
                    <Link to={`/blog/${post.title}`} style={{ color: "#333", textDecoration: "none" }}>
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {searchResults.products.length === 0 && searchResults.posts.length === 0 && (
            <div style={{ color: "#888" }}>Không tìm thấy kết quả phù hợp</div>
          )}
        </div>
      )}
    </div>
  );
}