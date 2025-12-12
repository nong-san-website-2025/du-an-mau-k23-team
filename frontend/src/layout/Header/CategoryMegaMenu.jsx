import React from "react";
import { ChevronDown, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

// iconMap should be passed in to avoid coupling
export default function CategoryMegaMenu({
  categories,
  iconMap,
  showCategory,
  handleMouseEnter,
  handleMouseLeave,
  handleCategoryHover,
  setShowCategory,
}) {
  const navigate = useNavigate();

  return (
    <div className="position-relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className="btn btn-link fw-bold text-dark px-2 py-2"
        style={{ fontSize: 18, textDecoration: "none" }}
        onClick={() => navigate("/products")}
      >
        <span style={{ fontSize: 18, color: "#FFFFFF" }}>Danh mục sản phẩm</span>
      </button>
      {showCategory && (
        <div
          className="shadow-lg bg-white rounded position-absolute mt-2"
          style={{
            minWidth: 0,
            width: 950,
            
            left: 0,
            top: "100%",
            zIndex: 1000,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            padding: 32,
          }}
        >
          <div className="row" style={{ minWidth: 0, width: 1000}}>
            {categories.map((cat) => {
              const IconComponent = iconMap[cat.icon] || Package;
              return (
                <div key={cat.id} className="col-12 col-md-4 mb-4" style={{ minWidth: 260, width: 300 }}>
                  <div
                    className="p-3 h-100 rounded-3"
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={() => handleCategoryHover(cat)}
                    onClick={() => {
                      navigate(`/products?category=${encodeURIComponent(cat.key || cat.name)}`);
                      setShowCategory(false);
                    }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <div
                        className="d-flex align-items-center justify-content-center me-2"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: "#bbf7d0",
                        }}
                      >
                        <IconComponent size={24} style={{ color: "#16a34a" }} />
                      </div>
                      <div>
                        <div className="fw-bold" style={{ fontSize: 18, color: "#16a34a" }}>
                          {cat.name}
                        </div>
                        <div className="small text-muted">{cat.subcategories?.length || 0} danh mục con</div>
                      </div>
                    </div>
                    <div className="ps-2 pt-2" style={{ fontSize: 15, color: "#444" }}>
                      {cat.subcategories?.length ? (
                        cat.subcategories.map((sub) => (
                          <div
                            key={sub.name}
                            className="mb-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/products?category=${encodeURIComponent(cat.key || cat.name)}&subcategory=${encodeURIComponent(
                                  sub.name
                                )}`
                              );
                              setShowCategory(false);
                            }}
                          >
                            {sub.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted small">Không có danh mục con</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}