import React, { useEffect, useState } from "react";
import useUserProfile from "../features/users/services/useUserProfile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../features/cart/services/CartContext";
import { useNavigate } from "react-router-dom";

import Logo from "./Header/Logo";
import SearchBoxWithSuggestions from "./Header/SearchBoxWithSuggestions";
import UserActions from "./Header/UserActions";
import TopBar from "./Header/TopBar";
import { useAuth } from "../features/login_register/services/AuthContext";

import useSellerStatus from "../services/hooks/useSellerStatus";
import useSearch from "../services/hooks/useSearch";

export default function Header({ shouldFetchProfile = true }) {
  const userProfile = useUserProfile();
  const { logout } = useAuth();
  const { cartItems } = useCart();
  const cartCount = cartItems.length;
  const [popularItems, setPopularItems] = useState([]);

  const navigate = useNavigate();

  const { storeName, sellerStatus } = useSellerStatus(shouldFetchProfile);
  const {
    search,
    setSearch,
    searchResults,
    showSuggestions,
    setShowSuggestions,
    searchRef,
    handleSearchChange,
  } = useSearch();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const [hotKeywords, setHotKeywords] = useState([]);

  const greenText = {
    color: "#4caf50",
    fontFamily: "Montserrat, Arial, sans-serif",
    fontWeight: 800,
  };

  useEffect(() => {
    fetch("/api/search/popular-keywords/")
      .then((res) => res.json())
      .then((data) => {
        const keywords = data.keywords?.slice(0, 7) || [];
        setHotKeywords(keywords);
      })
      .catch((err) => {
        console.error("❌ Fetch hot keywords failed:", err);
        setHotKeywords([]);
      });
  }, []);

  useEffect(() => {
    fetch("/api/search/popular-items/")
      .then((res) => res.json())
      .then((data) => setPopularItems(data.items || []))
      .catch((err) => console.error("Failed to load popular items", err));
  }, []);
  const handleLogout = async () => {
    await logout(); // gọi logout từ AuthContext
    setShowProfileDropdown(false);
    navigate("/login", { replace: true });
  };

  const handleSearchSubmit = async () => {
    if (!search.trim()) return;
    navigate(`/search?query=${encodeURIComponent(search)}`);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <header
        className="shadow-sm"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 999,
          fontFamily: "Montserrat, Arial, sans-serif",
          background: "#2E7D32",
          width: "100%",
        }}
      >
        <TopBar />
        <div
          className="border-bottom px-3 px-md-5"
          style={{
            background: "linear-gradient(to bottom, #2E7D32 0%, #4CAF50 100%)",
          }}
        >
          <div
            className="container-fluid d-flex flex-column flex-md-row align-items-center justify-content-between py-1 px-1"
            style={{
              minHeight: "60px",
              position: "relative",
            }}
          >
            <div className="w-100 d-flex justify-content-center justify-content-md-start" style={{ paddingBottom: 10 }}>
              <Logo greenText={greenText} />
            </div>

            <div
              className="w-100 d-flex justify-content-center"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                marginBottom: 10,
              }}
            >
              <SearchBoxWithSuggestions
                search={search}
                setSearch={setSearch}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                searchResults={searchResults}
                handleSearchChange={handleSearchChange}
                handleSearchSubmit={handleSearchSubmit}
                greenText={greenText}
                containerRef={searchRef}
              />

              {popularItems.length > 0 && (
                <div
                  className="d-none d-md-flex"
                  style={{
                    flexWrap: "wrap",
                    gap: "4px",
                    marginTop: "4px",
                  }}
                >
                  {popularItems.slice(0, 7).map((item) => (
                    <span
                      key={`${item.type}-${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (item.type === "product") {
                          navigate(`/products/${item.id}`);
                        } else if (item.type === "category") {
                          navigate(
                            `/products?category=${encodeURIComponent(item.name)}`
                          );
                        }
                      }}
                      style={{
                        padding: "4px 6px",
                        color: "white",
                        borderRadius: "16px",
                        fontSize: "13px",
                        cursor: "pointer",
                        whiteSpace: "nowrap", // ← không xuống dòng
                        overflow: "hidden", // ← ẩn phần tràn
                        textOverflow: "clip", // ← hiển thị "..." khi tràn
                        maxWidth: "120px", // ← giới hạn độ rộng (bắt buộc để ellipsis hoạt động)
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="w-100 d-flex justify-content-center justify-content-md-end">
              <UserActions
                greenText={greenText}
                cartCount={cartCount}
                cartItems={cartItems}
                showCartDropdown={showCartDropdown}
                setShowCartDropdown={setShowCartDropdown}
                userProfile={userProfile}
                showProfileDropdown={showProfileDropdown}
                setShowProfileDropdown={setShowProfileDropdown}
                handleLogout={handleLogout}
                showNotificationDropdown={showNotificationDropdown}
                setShowNotificationDropdown={setShowNotificationDropdown}
                hoveredDropdown={hoveredDropdown}
                setHoveredDropdown={setHoveredDropdown}
                storeName={storeName}
                sellerStatus={sellerStatus}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
