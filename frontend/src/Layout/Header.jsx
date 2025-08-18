import React, { useState, useEffect, useRef } from "react";
import useUserProfile from "../features/users/services/useUserProfile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../features/cart/services/CartContext";
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
  Bell,
} from "lucide-react";
import { productApi } from "../features/products/services/productApi";
import axios from "axios";

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
  // Lấy số lượng sản phẩm trong giỏ
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const { cartItems } = useCart();
  const cartCount = cartItems.length;
  const userProfile = useUserProfile();
  // Xử lý đăng xuất
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Đơn hàng #1234 đã được xác nhận",
      detail: "Chi tiết đơn hàng #1234...",
      thumbnail: "/media/cart_items/order-confirmed.png"
    },
    {
      id: 2,
      title: "Bạn nhận được voucher mới",
      detail: "Bạn vừa nhận được voucher giảm giá 10%...",
      thumbnail: "/media/cart_items/voucher.png"
    },
    {
      id: 3,
      title: "Cập nhật chính sách vận chuyển",
      detail: "Chính sách vận chuyển mới áp dụng từ 8/8...",
      thumbnail: "/media/cart_items/policy-update.png"
    },
  ]);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    sessionStorage.clear(); // Nếu có sessionStorage dùng
    setShowProfileDropdown(false);
    alert("Đăng xuất thành công!");
    window.location.replace("/login");
  };
  const [showCategory, setShowCategory] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const [leaveTimeout, setLeaveTimeout] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const btn = document.getElementById("profileDropdownBtn");
      const dropdown = document.getElementById("profileDropdownMenu");
      if (
        btn &&
        !btn.contains(e.target) &&
        dropdown &&
        !dropdown.contains(e.target)
      ) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productApi.getCategoriesWithProducts();
        setCategories(data);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const greenStyle = { backgroundColor: "#22C55E" };
  const greenText = { color: "#22C55E", fontFamily: 'Montserrat, Arial, sans-serif', fontWeight: 800 };
  const headerFont = { fontFamily: 'Montserrat, Arial, sans-serif', fontWeight: 700 };

  const urlCategory =
    decodeURIComponent(
      new URLSearchParams(location.search).get("category") || ""
    ) ||
    (categories[0] && categories[0].name);

  const handleCategoryHover = (cat) => setHoveredCategory(cat.name);
  const handleMouseEnter = () => {
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      setLeaveTimeout(null);
    }
    setShowCategory(true);
  };
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowCategory(false);
      setHoveredCategory(null);
    }, 100);
    setLeaveTimeout(timeout);
  };
  useEffect(() => {
    return () => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
      }
    };
  }, [leaveTimeout]);

  // --- SEARCH FEATURE ---
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState({ products: [], posts: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);

    if (value.trim() !== "") {
      try {
        const res = await axios.get(`/api/products/search/?q=${value}`);
        setSearchResults(res.data);
        setShowSuggestions(true);
      } catch (error) {
        setSearchResults({ products: [], posts: [] });
        setShowSuggestions(false);
      }
    } else {
      setSearchResults({ products: [], posts: [] });
      setShowSuggestions(false);
    }
  };

  // --- END SEARCH FEATURE ---

  const [storeName, setStoreName] = useState("");
  useEffect(() => {
    // Nếu user là seller, lấy tên cửa hàng
    const token = localStorage.getItem("token");
    const isSeller = localStorage.getItem("is_seller")?.toLowerCase() === "true";

    if (token && isSeller) {
      function getUserIdFromToken() {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.user_id || payload.id;
        } catch {
          return null;
        }
      }
      const userId = getUserIdFromToken();
      if (userId) {
        fetch(`http://localhost:8000/api/sellers/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            console.log("Seller data:", data);
            const seller = data.find(s => s.status === "approved");
            if (seller) {
              setStoreName(seller.store_name);
            }
          });
      }
    }
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <header
        className="shadow-sm"
        style={{ position: "sticky", top: 0, zIndex: 999, fontFamily: 'Montserrat, Arial, sans-serif', background: '#f8fafc' }}
      >
        {/* Top bar */}
        <div style={greenStyle} className="text-white small py-0" >
          <div
            className="container d-flex justify-content-between align-items-center px-2"
            style={{ minHeight: "36px" }}
          >
            <div
              className="d-flex align-items-center"
              style={{ gap: "2rem", flexWrap: "nowrap" }}
            >
              <div
                className="d-flex align-items-center"
                style={{ whiteSpace: "nowrap", fontSize: 16, fontWeight: 600 }}
              >
                <Phone size={16} className="me-1" />
                <span>Hotline: <b style={{ letterSpacing: 1 }}>1900-1234</b></span>
              </div>
              <div
                className="d-flex align-items-center d-none d-md-flex"
                style={{ whiteSpace: "nowrap", fontSize: 16, fontWeight: 600 }}
              >
                <Mail size={16} className="me-1" />
                <span>Email: <b style={{ letterSpacing: 1 }}>support@nongsan.vn</b></span>
              </div>
            </div>
            <div
              className="d-flex align-items-center"
              style={{ gap: "2rem", flexWrap: "nowrap" }}
            >
              <span
                className="d-none d-lg-inline"
                style={{ whiteSpace: "nowrap", fontWeight: 700, fontSize: 15 }}
              >
                <span style={{ color: '#fff', background: '#16a34a', borderRadius: 6, padding: '2px 10px' }}>Miễn phí vận chuyển đơn từ 200K</span>
              </span>
              <div
                className="d-flex align-items-center"
                style={{ whiteSpace: "nowrap", fontWeight: 700, fontSize: 15 }}
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
        <div
          className="bg-white border-bottom"
          style={{ position: "relative", boxShadow: '0 2px 8px #0001' }}
        >
          <div
            className="container d-flex align-items-center justify-content-between py-2 px-2"
            style={{ minHeight: "60px", flexWrap: "nowrap" }}
          >
            {/* Logo */}
            <Link
              to="/"
              className="navbar-brand d-flex align-items-center"
              style={{ ...greenText, fontSize: 32, letterSpacing: 2 }}
            >
              <img src="assets/logo/imagelogo.png" alt="Logo" className="me-2" style={{ height: 56, borderRadius: 12, boxShadow: '0 2px 8px #0002' }} />
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
                  onClick={() => navigate("/productuser")} // ← chuyển sang productuser
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
                                navigate(
                                  `/productuser?category=${encodeURIComponent(
                                    cat.key || cat.name
                                  )}`
                                );
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
                                  <IconComponent
                                    size={24}
                                    style={{ color: "#16a34a" }}
                                  />
                                </div>
                                <div>
                                  <div
                                    className="fw-bold"
                                    style={{ fontSize: 18, color: "#16a34a" }}
                                  >
                                    {cat.name}
                                  </div>
                                  <div className="small text-muted">
                                    {cat.subcategories?.length || 0} danh mục
                                    con
                                  </div>
                                </div>
                              </div>
                              <div
                                className="ps-2 pt-2"
                                style={{ fontSize: 15, color: "#444" }}
                              >
                                {cat.subcategories?.length ? (
                                  cat.subcategories.map((sub) => (
                                    <div
                                      key={sub.name}
                                      className="mb-1"
                                      style={{ cursor: "pointer" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/productuser?category=${encodeURIComponent(
                                            cat.key || cat.name
                                          )}&subcategory=${encodeURIComponent(
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
                                  <div className="text-muted small">
                                    Không có danh mục con
                                  </div>
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
                to="/store"
                className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
                style={{ whiteSpace: "nowrap" }}
              >
                Cửa hàng
              </Link>
              <Link
                to="/blog"
                className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
                style={{ whiteSpace: "nowrap" }}
              >
                Bài viết
              </Link>
              <Link
                to="/abouts"
                className="btn btn-link fw-medium px-3 py-2 text-decoration-none text-dark d-none d-xl-inline-block"
                style={{ whiteSpace: "nowrap" }}
              >
                Về chúng tôi
              </Link>
            </nav>

            {/* Search & Actions */}
            <div
              className="d-flex align-items-center ms-3"
              style={{ flexShrink: 0, flexWrap: "nowrap" }}
            >
              <div className="position-relative me-3 d-none d-md-block" ref={searchRef} style={{ zIndex: 3000 }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm hoặc bài viết..."
                  className="form-control rounded-pill ps-3 pe-5"
                  style={{ width: 200, minWidth: 150 }}
                  value={search}
                  onChange={handleSearchChange}
                  onFocus={() => search && setShowSuggestions(true)}
                />
                <button
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0"
                  style={{ right: 10, color: "#16a34a" }}
                >
                  <Search size={18} />
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
                          {searchResults.products.map(product => (
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
                          {searchResults.posts.map(post => (
                            <li key={post.id} style={{ padding: "6px 0" }}>
                              <Link to={`/blog/${post.title}`} style={{ color: "#333", textDecoration: "none" }}>
                                {post.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(searchResults.products.length === 0 && searchResults.posts.length === 0) && (
                      <div style={{ color: "#888" }}>Không tìm thấy kết quả phù hợp</div>
                    )}
                  </div>
                )}
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
              {/* Notification icon and dropdown (hover) */}
              <div style={{ position: "relative" }}
                onMouseEnter={() => setShowNotificationDropdown(true)}
                onMouseLeave={() => setShowNotificationDropdown(false)}>
                <button
                  className="btn btn-light rounded-circle me-2 p-2"
                  style={{ flexShrink: 0 }}
                  aria-label="Thông báo"
                  onClick={() => navigate('/notification')}
                >
                  <Bell size={22} style={greenText} />
                </button>
                {showNotificationDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      minWidth: 320,
                      maxWidth: 400,
                      background: "#fff",
                      boxShadow: "0 4px 16px #0002",
                      borderRadius: 10,
                      zIndex: 2000,
                      padding: "12px 0",
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: 14, padding: "0 18px 8px 18px", color: "#16a34a" }}>
                      Thông báo vừa nhận
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "12px 18px", color: "#888" }}>Không có thông báo mới</div>
                    ) : (
                      <>
                        {notifications.slice(0, 4).map((noti) => (
                          <div
                            key={noti.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "12px 18px",
                              borderBottom: "1px solid #eee",
                              cursor: "pointer",
                              fontSize: 15,
                              color: "#333",
                              transition: "background 0.2s",
                            }}
                            onClick={() => {
                              setShowNotificationDropdown(false);
                              navigate(`/notification/${noti.id}`);
                            }}
                          >
                            <img
                              src={noti.thumbnail}
                              alt="thumb"
                              style={{
                                width: 38,
                                height: 38,
                                objectFit: "cover",
                                borderRadius: 8,
                                marginRight: 8,
                                background: "#f0fdf4",
                                border: "1px solid #e5e7eb",
                              }}
                            />
                            <span>{noti.title}</span>
                          </div>
                        ))}
                        <div
                          style={{
                            textAlign: "center",
                            padding: "10px 0 0 0",
                          }}
                        >
                          <button
                            className="btn btn-link"
                            style={{ color: "#16a34a", fontWeight: 600, fontSize: 15 }}
                            onClick={() => {
                              setShowNotificationDropdown(false);
                              navigate("/notification");
                            }}
                          >
                            Xem tất cả thông báo
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Cart icon and dropdown (hover) */}
              <div style={{ position: "relative" }}
                onMouseEnter={() => setShowCartDropdown(true)}
                onMouseLeave={() => setShowCartDropdown(false)}>
                <button
                  className="btn btn-light rounded-circle me-2 p-2 position-relative"
                  style={{ flexShrink: 0 }}
                  aria-label="Giỏ hàng"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart size={22} style={greenText} />
                  {cartCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        minWidth: 18,
                        height: 18,
                        background: "#dc2626",
                        color: "#fff",
                        borderRadius: "50%",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                        zIndex: 10,
                        boxShadow: "0 1px 4px #0002",
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
                {showCartDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      minWidth: 320,
                      maxWidth: 400,
                      background: "#fff",
                      boxShadow: "0 4px 16px #0002",
                      borderRadius: 10,
                      zIndex: 2000,
                      padding: "12px 0",
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: 14, padding: "0 18px 8px 18px", color: "#16a34a" }}>
                      Sản phẩm trong giỏ hàng
                    </div>
                    {cartItems.length === 0 ? (
                      <div style={{ padding: "12px 18px", color: "#888" }}>Giỏ hàng trống</div>
                    ) : (
                      <>
                        {cartItems.slice(0, 4).map((item) => (
                          <div
                            key={item.id || item.product_id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "12px 18px",
                              borderBottom: "1px solid #eee",
                              cursor: "pointer",
                              fontSize: 15,
                              color: "#333",
                              transition: "background 0.2s",
                            }}
                            onClick={() => {
                              setShowCartDropdown(false);
                              navigate(`/cart`);
                            }}
                          >
                            <img
                              src={item.product?.thumbnail || "/media/products/default.png"}
                              alt="thumb"
                              style={{
                                width: 38,
                                height: 38,
                                objectFit: "cover",
                                borderRadius: 8,
                                marginRight: 8,
                                background: "#f0fdf4",
                                border: "1px solid #e5e7eb",
                              }}
                            />
                            <span>{item.product?.name || "Sản phẩm"}</span>
                            <span style={{ marginLeft: "auto", color: "#16a34a", fontWeight: 600 }}>
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                        <div
                          style={{
                            textAlign: "center",
                            padding: "10px 0 0 0",
                          }}
                        >
                          <button
                            className="btn btn-link"
                            style={{ color: "#16a34a", fontWeight: 600, fontSize: 15 }}
                            onClick={() => {
                              setShowCartDropdown(false);
                              navigate("/cart");
                            }}
                          >
                            Xem tất cả sản phẩm
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Chỉ hiện dropdown nếu đã đăng nhập, nếu chưa thì hiện nút đăng nhập */}
              {localStorage.getItem("token") &&
                localStorage.getItem("username") ? (
                <div className="dropdown" style={{ position: "relative" }}>
                  <button
                    className="btn btn-light rounded-circle p-2"
                    style={{ flexShrink: 0 }}
                    id="profileDropdownBtn"
                    onClick={() => setShowProfileDropdown((v) => !v)}
                    aria-expanded={showProfileDropdown ? "true" : "false"}
                  >
                    {userProfile && userProfile.avatar ? (
                      <img
                        src={userProfile.avatar}
                        alt="avatar"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #eee",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#16a34a",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 18,
                          textTransform: "uppercase",
                        }}
                      >
                        {localStorage.getItem("username")[0]}
                      </span>
                    )}
                  </button>

                  {showProfileDropdown && (
                    <div
                      id="profileDropdownMenu"
                      className="dropdown-menu show p-0"
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "110%",
                        minWidth: 220,
                        boxShadow: "0 4px 16px #0002",
                        borderRadius: 12,
                        zIndex: 2000,
                        overflow: "hidden",
                        background: "#fff"
                      }}
                    >
                      <div className="d-flex flex-column align-items-center py-3 px-3 border-bottom" style={{ background: '#f0fdf4' }}>
                        {userProfile && userProfile.avatar ? (
                          <img
                            src={userProfile.avatar}
                            alt="avatar"
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid #22C55E",
                              boxShadow: "0 2px 8px #22c55e22"
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              background: "#22C55E",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: 24,
                              textTransform: "uppercase",
                              boxShadow: "0 2px 8px #22c55e22"
                            }}
                          >
                            {localStorage.getItem("username")[0]}
                          </span>
                        )}
                        <div className="mt-2 text-center">
                          <span style={{ fontWeight: 700, fontSize: 18, color: '#16a34a' }}>{localStorage.getItem("username")}</span>
                        </div>
                        <button
                          className="btn btn-outline-success btn-sm mt-2 px-3 fw-bold"
                          style={{ borderRadius: 6, fontSize: 15 }}
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate("/profile");
                          }}
                        >
                          Xem hồ sơ
                        </button>
                      </div>
                      <Link
                        to="/orders"
                        className="dropdown-item"
                        style={{ padding: "12px 18px", fontWeight: 500 }}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Đơn hàng của tôi
                      </Link>

                      <Link
                        to={storeName ? "" : "/register-seller"}
                        className="dropdown-item text-white fw-bold d-flex justify-content-left"
                        style={{
                          background: hoveredDropdown === 'register' ? '#16a34a' : '#22C55E',
                          borderRadius: 0,
                          margin: '0px 0px',
                          boxShadow: hoveredDropdown === 'register' ? '0 4px 16px #16a34a44' : '0 2px 8px #22c55e44',
                          fontSize: 16,
                          padding: '12px 18px',
                          border: 'none',
                          transition: 'all 0.2s',
                          filter: hoveredDropdown === 'register' ? 'brightness(0.95)' : 'none',
                        }}
                        onMouseEnter={() => setHoveredDropdown('register')}
                        onMouseLeave={() => setHoveredDropdown(null)}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {storeName ? "Cửa hàng của tôi" : "Đăng ký bán hàng"}
                        </span>
                      </Link>
                      <div
                        className="dropdown-divider"
                        style={{ margin: 0, borderTop: "1px solid #eee" }}
                      />
                      <button
                        className="dropdown-item text-danger"
                        style={{
                          padding: "12px 18px",
                          fontWeight: 500,
                          background: hoveredDropdown === 'logout' ? '#fee2e2' : 'none',
                          color: hoveredDropdown === 'logout' ? '#b91c1c' : '#dc2626',
                          border: "none",
                          width: "100%",
                          textAlign: "left",
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={() => setHoveredDropdown('logout')}
                        onMouseLeave={() => setHoveredDropdown(null)}
                        onClick={handleLogout}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-light rounded-circle p-2"
                  style={{ flexShrink: 0 }}
                >
                  <User size={22} style={greenText} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}