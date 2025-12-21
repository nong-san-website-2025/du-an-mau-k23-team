import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import NotificationDropdown from "../components/NotificationDropdown";
import CartDropdown from "../components/CartDropdown";
import UserProfileDropdown from "../components/UserProfileDropdown";
import "../styles/UserActions.css"; // File CSS mới ở trên

export default function UserActions(props) {
  const {
    cartCount,
    cartItems,
    showCartDropdown,
    setShowCartDropdown,
    userProfile,
    handleLogout,
    showNotificationDropdown,
    setShowNotificationDropdown,
    sellerStatus,
    hoveredDropdown,
    setHoveredDropdown,
  } = props;

  const isUserLoggedIn = !!localStorage.getItem("token");

  return (
    // Thêm class 'header-dark' vào đây nếu header nền tối để icon đổi màu trắng
    <div className="user-actions-container">
      

      {/* 2. Notifications */}
      <NotificationDropdown
        userId={userProfile?.id}
        showDropdown={showNotificationDropdown}
        setShowDropdown={setShowNotificationDropdown}
      />

      {/* 3. Cart */}
      <CartDropdown
        cartCount={cartCount}
        cartItems={cartItems}
        showDropdown={showCartDropdown}
        setShowDropdown={setShowCartDropdown}
      />

      {/* 4. User Profile */}
      <UserProfileDropdown
        isUserLoggedIn={isUserLoggedIn}
        userProfile={userProfile}
        handleLogout={handleLogout}
        sellerStatus={sellerStatus}
        hoveredDropdown={hoveredDropdown}
        setHoveredDropdown={setHoveredDropdown}
      />
    </div>
  );
}