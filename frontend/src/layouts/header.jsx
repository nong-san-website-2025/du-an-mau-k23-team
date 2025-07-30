import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Carrot,
  Apple,
  Wheat,
  Beef,
  Milk,
  Coffee,
  Phone,
  Mail,
  Globe,
  Sun,
  Search,
  Heart,
  ShoppingCart,
  User,
  Package,
} from "lucide-react";
import { productApi } from "../services/productApi";

const iconMap = {
  Carrot: Carrot,
  Apple: Apple,
  Wheat: Wheat,
  Beef: Beef,
  Milk: Milk,
  Coffee: Coffee,
  Package: Package,
};

export default function Header() {
  const [showCategory, setShowCategory] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [leaveTimeout, setLeaveTimeout] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await productApi.getCategoriesWithProducts();
        setCategories(data);
      } catch (err) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const greenStyle = { backgroundColor: "#16a34a" };
  const greenText = { color: "#16a34a" };

  // Lấy category đang active từ URL
  const urlCategory =
    decodeURIComponent(
      new URLSearchParams(location.search).get("category") || ""
    ) || (categories[0] && categories[0].name);

  // Khi hover vào danh mục, đổi hoveredCategory
  const handleCategoryHover = (cat) => setHoveredCategory(cat.name);

  // Khi mouse enter vào dropdown area
  const handleMouseEnter = () => {
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      setLeaveTimeout(null);
    }
    setShowCategory(true);
  };

  // Khi rời khỏi toàn bộ dropdown area, ẩn dropdown với delay
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowCategory(false);
      setHoveredCategory(null);
    }, 300);
    setLeaveTimeout(timeout);
  };

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
      }
    };
  }, [leaveTimeout]);

  // Danh mục đang được highlight (ưu tiên hovered, nếu không thì theo URL)
  const activeCategory =
    categories.find((cat) => cat.name === (hoveredCategory || urlCategory)) ||
    categories[0];

  return (
    <header
      className="shadow-sm"
      style={{ position: "sticky", top: 0, zIndex: 999 }}
    >
      {/* Top bar */}
      <div style={greenStyle} className="text-white small py-2">
        <div
          className="container d-flex justify-content-between align-items-center px-2"
          style={{ minHeight: "40px" }}
        >
          <div
            className="d-flex align-items-center"
            style={{ gap: "1rem", flexWrap: "nowrap" }}
          >
            <div
              className="d-flex align-items-center"
              style={{ whiteSpace: "nowrap" }}
            >
              <Phone size={16} className="me-1" />
              <span>Hotline: 1900-1234</span>
            </div>
            <div
              className="d-flex align-items-center d-none d-md-flex"
              style={{ whiteSpace: "nowrap" }}
            >
              <Mail size={16} className="me-1" />
              <span>support@nongsan.vn</span>
            </div>
          </div>
          <div
            className="d-flex align-items-center"
            style={{ gap: "1rem", flexWrap: "nowrap" }}
          >
            <span
              className="d-none d-lg-inline"
              style={{ whiteSpace: "nowrap" }}
            >
              Miễn phí vận chuyển đơn từ 200K
            </span>
            <div
              className="d-flex align-items-center"
              style={{ whiteSpace: "nowrap" }}
            >
              <Globe size={16} className="me-1" />
              <span>Tiếng Việt</span>
              <ChevronDown size={14} className="ms-1" />
            </div>
            <button
              className="btn btn-link text-white p-0"
              style={{ boxShadow: "none", flexShrink: 0 }}
            >
              <Sun size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white border-bottom" style={{ position: "relative" }}>
        <div
          className="container d-flex align-items-center justify-content-between py-3 px-2"
          style={{ minHeight: "80px", flexWrap: "nowrap" }}
        >
          {/* Logo */}
          <Link
            to="/"
            className="navbar-brand fw-bold fs-3 d-flex align-items-center"
            style={greenText}
          >
            <span className="me-2">NôngSản.vn</span>
          </Link>

          {/* Navigation */}
          <nav
            className="d-flex align-items-center flex-grow-1 ms-4"
            style={{ flexWrap: "nowrap" }}
          >
            {/* Mega menu danh mục sản phẩm */}
            <div
              className="position-relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="btn btn-link fw-bold text-dark px-3 py-2"
                style={{ fontSize: 18, textDecoration: "none" }}
                onClick={() => setShowCategory((v) => !v)}
              >
                Danh mục sản phẩm <ChevronDown size={18} />
              </button>
              {showCategory && (
                <div
                  className="shadow-lg bg-white rounded position-absolute mt-2"
                  style={{
                    minWidth: 900,
                    left: 0,
                    top: "100%",
                    zIndex: 1000,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    padding: 32,
                  }}
                >
                  <div className="row" style={{ minWidth: 900 }}>
                    {categories.map((cat) => {
                      const IconComponent = iconMap[cat.icon] || Package;
                      return (
                        <div
                          key={cat.id}
                          className="col-12 col-md-4 mb-4"
                          style={{ minWidth: 260, maxWidth: 320 }}
                        >
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
                              navigate(`/productuser?category=${encodeURIComponent(cat.key || cat.name)}`);
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
                                <div className="fw-bold" style={{ fontSize: 18, color: "#16a34a" }}>{cat.name}</div>
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
                                    onClick={e => {
                                      e.stopPropagation();
                                      navigate(`/productuser?category=${encodeURIComponent(cat.key || cat.name)}&subcategory=${encodeURIComponent(sub.name)}`);
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
            <Link
              to="/featured"
              className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-lg-inline-block"
              style={{ whiteSpace: "nowrap" }}
            >
              Sản phẩm nổi bật
            </Link>
            <Link
              to="/promotions"
              className="btn btn-link fw-medium px-3 py-2 text-danger text-decoration-none"
              style={{ whiteSpace: "nowrap" }}
            >
              Khuyến mãi
            </Link>
            <Link
              to="/about"
              className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
              style={{ whiteSpace: "nowrap" }}
            >
              Về chúng tôi
            </Link>
            <Link
              to="/contact"
              className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
              style={{ whiteSpace: "nowrap" }}
            >
              Liên hệ
            </Link>
          </nav>

          {/* Search & Actions */}
          <div
            className="d-flex align-items-center ms-3"
            style={{ flexShrink: 0, flexWrap: "nowrap" }}
          >
            <div className="position-relative me-3 d-none d-md-block">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="form-control rounded-pill ps-3 pe-5"
                style={{ width: 200, minWidth: 150 }}
              />
              <button
                className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0"
                style={{ right: 10, color: "#16a34a" }}
              >
                <Search size={18} />
              </button>
            </div>
            {/* Mobile search button */}
            <button className="btn btn-light rounded-circle me-2 p-2 d-md-none">
              <Search size={22} style={greenText} />
            </button>
            <Link
              to="/wishlist"
              className="btn btn-light rounded-circle me-2 p-2 d-none d-sm-inline-block"
              style={{ flexShrink: 0 }}
            >
              <Heart size={22} style={greenText} />
            </Link>
            <Link
              to="/cart"
              className="btn btn-light rounded-circle me-2 p-2"
              style={{ flexShrink: 0 }}
            >
              <ShoppingCart size={22} style={greenText} />
            </Link>
            <Link
              to="/dashboard"
              className="btn btn-light rounded-circle p-2"
              style={{ flexShrink: 0 }}
            >
              <User size={22} style={greenText} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
