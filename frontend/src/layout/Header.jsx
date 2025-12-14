import React, { useState } from "react";
// Import Hooks: Ưu tiên dùng Hook để tách biệt logic (Separation of Concerns)
import { useHeaderLogic } from "../hooks/useHeaderLogic";
import useUserProfile from "../features/users/services/useUserProfile";
import { useCart } from "../features/cart/services/CartContext";
import useSellerStatus from "../services/hooks/useSellerStatus"; // Giữ lại Hook này
import useSearch from "../services/hooks/useSearch";

// Styles
import styles from "../styles/Header.module.css";

// Sub-components
import Logo from "./Header/Logo";
import SearchBoxWithSuggestions from "./Header/SearchBoxWithSuggestions";
import UserActions from "./Header/UserActions";
import TopBar from "./Header/TopBar";

export default function Header({ shouldFetchProfile = true }) {
  // 1. Logic extracted to custom hooks (Giữ kiến trúc của HEAD)
  const { 
    popularItems, 
    handleLogout, 
    handlePopularItemClick, 
    navigate, 
    contextHolder 
  } = useHeaderLogic();

  const userProfile = useUserProfile();
  const { cartItems } = useCart();
  
  // MERGE DECISION: Sử dụng useSellerStatus thay vì gọi API trực tiếp tại đây.
  // Nếu code của MinhKhanh fix lỗi API, hãy mang logic fetch đó vào trong file useSellerStatus.js
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

  // 2. Local UI State
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);

  // Constants
  const cartCount = cartItems.length;
  const greenText = {
    color: "#4caf50",
    fontFamily: "Montserrat, Arial, sans-serif",
    fontWeight: 800,
  };

  const onSearchSubmit = () => {
    if (!search.trim()) return;
    navigate(`/search?query=${encodeURIComponent(search)}`);
  };

  // Wrapper để xử lý state UI khi logout
  const onLogoutClick = () => handleLogout(setShowProfileDropdown);

  return (
    <>
      {/* Ant Design Notification Container */}
      {contextHolder}

      <header className={styles.headerWrapper}>
        <TopBar />
        
        {/* MERGE DECISION: Giữ lại Layout Grid của HEAD vì responsive tốt hơn Inline Styles của MinhKhanh */}
        <div className={styles.mainBar}>
          <div className={`container-fluid ${styles.containerCustom}`}>
            <div className="row w-100 align-items-center m-0">
              
              {/* LOGO: Col-6 (Mobile) / Col-md-2 (Desktop) */}
              <div className="col-6 col-md-3 col-lg-2 p-0">
                <Logo greenText={greenText} />
              </div>

              {/* USER ACTIONS (Mobile Only - Đảo vị trí lên trên cho dễ bấm) */}
              <div className="col-6 d-md-none p-0 d-flex justify-content-end">
                 <UserActions
                    greenText={greenText}
                    cartCount={cartCount}
                    cartItems={cartItems}
                    showCartDropdown={showCartDropdown}
                    setShowCartDropdown={setShowCartDropdown}
                    userProfile={userProfile}
                    showProfileDropdown={showProfileDropdown}
                    setShowProfileDropdown={setShowProfileDropdown}
                    handleLogout={onLogoutClick}
                    showNotificationDropdown={showNotificationDropdown}
                    setShowNotificationDropdown={setShowNotificationDropdown}
                    hoveredDropdown={hoveredDropdown}
                    setHoveredDropdown={setHoveredDropdown}
                    storeName={storeName}
                    sellerStatus={sellerStatus}
                  />
              </div>

              {/* SEARCH BOX: Col-12 (Mobile - xuống dòng) / Col-md-6 (Desktop - ở giữa) */}
              <div className="col-12 col-md-6 col-lg-7 mt-2 mt-md-0 position-relative">
                <SearchBoxWithSuggestions
                  search={search}
                  setSearch={setSearch}
                  showSuggestions={showSuggestions}
                  setShowSuggestions={setShowSuggestions}
                  searchResults={searchResults}
                  handleSearchChange={handleSearchChange}
                  handleSearchSubmit={onSearchSubmit}
                  greenText={greenText}
                  containerRef={searchRef}
                />

                {/* Popular Tags */}
                {popularItems.length > 0 && (
                  <div className={`${styles.popularTagsContainer} d-none d-md-flex`}>
                    {popularItems.slice(0, 7).map((item) => (
                      <span
                        key={`${item.type}-${item.id}`}
                        className={styles.tagPill}
                        onClick={(e) => handlePopularItemClick(e, item)}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* USER ACTIONS (Desktop Only) */}
              <div className="d-none d-md-flex col-md-3 col-lg-3 justify-content-end p-0">
                <UserActions
                  greenText={greenText}
                  cartCount={cartCount}
                  cartItems={cartItems}
                  showCartDropdown={showCartDropdown}
                  setShowCartDropdown={setShowCartDropdown}
                  userProfile={userProfile}
                  showProfileDropdown={showProfileDropdown}
                  setShowProfileDropdown={setShowProfileDropdown}
                  handleLogout={onLogoutClick}
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
        </div>
      </header>
    </>
  );
}