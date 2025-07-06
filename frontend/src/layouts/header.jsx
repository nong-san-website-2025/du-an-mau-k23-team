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
} from "lucide-react";

const categories = [
  {
    name: "Rau Củ Quả",
    icon: Carrot,
    subcategories: ["Rau lá xanh", "Củ quả", "Nấm các loại", "Rau thơm"],
  },
  {
    name: "Trái Cây",
    icon: Apple,
    subcategories: [
      "Trái cây nhiệt đới",
      "Trái cây nhập khẩu",
      "Trái cây sấy",
      "Nước ép trái cây",
    ],
  },
  {
    name: "Gạo & Ngũ Cốc",
    icon: Wheat,
    subcategories: [
      "Gạo tẻ",
      "Gạo nàng hương",
      "Ngũ cốc dinh dưỡng",
      "Yến mạch",
    ],
  },
  {
    name: "Thịt & Hải Sản",
    icon: Beef,
    subcategories: ["Thịt bò", "Thịt heo", "Thịt gà", "Hải sản tươi sống"],
  },
  {
    name: "Sữa & Trứng",
    icon: Milk,
    subcategories: ["Sữa tươi", "Sữa chua", "Trứng gà", "Phô mai"],
  },
  {
    name: "Gia Vị & Đồ Khô",
    icon: Coffee,
    subcategories: ["Gia vị truyền thống", "Nước mắm", "Đồ khô", "Bánh kẹo"],
  },
];

export default function Header() {
  const [showCategory, setShowCategory] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [leaveTimeout, setLeaveTimeout] = useState(null);

  const greenStyle = { backgroundColor: "#16a34a" };
  const greenText = { color: "#16a34a" };

  // Lấy category đang active từ URL
  const urlCategory =
    decodeURIComponent(
      new URLSearchParams(location.search).get("category") || ""
    ) || categories[0].name;

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
    }, 300); // 300ms delay để user có thể di chuyển chuột
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
            className="d-flex align-items-center text-decoration-none"
          >
            <div
              className="d-flex align-items-center justify-content-center rounded text-white fw-bold fs-4 me-3"
              style={{ width: 40, height: 40, ...greenStyle }}
            >
              N
            </div>
            <div>
              <div className="fw-bold fs-4" style={greenText}>
                NôngSản.vn
              </div>
              <div className="text-muted small">Fresh & Organic</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className="d-flex align-items-center flex-grow-1 ms-4"
            style={{ flexWrap: "nowrap" }}
          >
            <div
              className="position-relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="btn btn-light d-flex align-items-center fw-medium px-3 py-2 me-2"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Danh mục sản phẩm <ChevronDown size={16} className="ms-1" />
              </button>
              {showCategory && (
                <div
                  className="position-absolute start-0 mt-2 shadow border"
                  style={{
                    width: 900,
                    maxWidth: "calc(100vw - 40px)",
                    zIndex: 9999,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    borderRadius: 16,
                    background: "#fff",
                    padding: "32px 24px",
                    top: "100%",
                    left: 0,
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="row g-4">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = cat.name === activeCategory.name;
                      return (
                        <div
                          className="col-4"
                          key={cat.name}
                          style={{
                            cursor: "pointer",
                            background: isActive ? "#e6faed" : "transparent",
                            borderRadius: 12,
                            padding: "20px 18px",
                            marginBottom: 8,
                            minHeight: 170,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={() => handleCategoryHover(cat)}
                          onClick={() => {
                            setShowCategory(false);
                            setHoveredCategory(null);
                            navigate(
                              `/productuser?category=${encodeURIComponent(
                                cat.name
                              )}`
                            );
                          }}
                        >
                          <div className="d-flex align-items-center mb-2">
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: 40,
                                height: 40,
                                backgroundColor: "#bbf7d0",
                                borderRadius: 12,
                                marginRight: 12,
                              }}
                            >
                              <Icon size={22} style={{ color: "#16a34a" }} />
                            </div>
                            <div>
                              <div
                                className="fw-bold"
                                style={{
                                  color: isActive ? "#16a34a" : "#222",
                                  fontSize: 18,
                                }}
                              >
                                {cat.name}
                              </div>
                              <div
                                className="text-muted"
                                style={{ fontSize: 14 }}
                              >
                                {cat.subcategories.length} danh mục con
                              </div>
                            </div>
                          </div>
                          <ul
                            className="ms-5"
                            style={{
                              color: "#555",
                              fontSize: 16,
                              marginTop: 8,
                              marginBottom: 0,
                              listStyle: "none",
                              paddingLeft: 0,
                              lineHeight: 2,
                            }}
                          >
                            {cat.subcategories.map((sub) => (
                              <li
                                key={sub}
                                style={{
                                  cursor: "pointer",
                                  background:
                                    isActive &&
                                    sub ===
                                      (location.search.includes("subcategory=")
                                        ? decodeURIComponent(
                                            new URLSearchParams(
                                              location.search
                                            ).get("subcategory")
                                          )
                                        : undefined)
                                      ? "#bbf7d0"
                                      : "transparent",
                                  borderRadius: 8,
                                  fontWeight:
                                    isActive &&
                                    sub ===
                                      (location.search.includes("subcategory=")
                                        ? decodeURIComponent(
                                            new URLSearchParams(
                                              location.search
                                            ).get("subcategory")
                                          )
                                        : undefined)
                                      ? 600
                                      : 400,
                                  textDecoration:
                                    isActive &&
                                    sub ===
                                      (location.search.includes("subcategory=")
                                        ? decodeURIComponent(
                                            new URLSearchParams(
                                              location.search
                                            ).get("subcategory")
                                          )
                                        : undefined)
                                      ? "underline"
                                      : "none",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCategory(false);
                                  setHoveredCategory(null);
                                  navigate(
                                    `/productuser?category=${encodeURIComponent(
                                      cat.name
                                    )}&subcategory=${encodeURIComponent(sub)}`
                                  );
                                }}
                              >
                                {sub}
                              </li>
                            ))}
                          </ul>
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
