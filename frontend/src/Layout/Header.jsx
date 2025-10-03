import React, { useState } from "react";
import useUserProfile from "../features/users/services/useUserProfile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../features/cart/services/CartContext";
import { useNavigate } from "react-router-dom";

import Logo from "./Header/Logo";
import SearchBoxWithSuggestions from "./Header/SearchBoxWithSuggestions";
import UserActions from "./Header/UserActions";
import TopBar from "./Header/TopBar";

import useSellerStatus from "../services/hooks/useSellerStatus";
import useSearch from "../services/hooks/useSearch";

export default function Header({ shouldFetchProfile = true }) {
  const userProfile = useUserProfile();

  const { cartItems } = useCart();
  const cartCount = cartItems.length;
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

  const greenText = {
    color: "#4caf50",
    fontFamily: "Montserrat, Arial, sans-serif",
    fontWeight: 800,
  };

  console.log("👤 userProfile trong Header:", userProfile);

  const handleLogout = () => {
    localStorage.clear();
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
          className="border-bottom"
          style={{
            background: "linear-gradient(to bottom, #2E7D32 0%, #4CAF50 100%)",
            padding: "0 120px",
          }}
        >
          <div
            className="container-fluid d-flex align-items-center justify-content-between py-1 px-1"
            style={{ minHeight: "60px", flexWrap: "nowrap" }}
          >
            <Logo greenText={greenText} />
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
      </header>
    </>
  );
}
