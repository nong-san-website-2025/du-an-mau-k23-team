import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import NotificationDropdown from "../components/NotificationDropdown";
import CartDropdown from "../components/CartDropdown";
import UserProfileDropdown from "../components/UserProfileDropdown";
import "../styles/UserActions.css";

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
    <div className="user-actions-container">
      {/* Wishlist */}
      <div className="action-item d-none d-sm-inline-block me-2">
        <Link to="/wishlist" className="action-btn">
          <Heart size={22} className="icon-default" />
        </Link>
      </div>

      {/* Notifications */}
      <NotificationDropdown
        userId={userProfile?.id}
        showDropdown={showNotificationDropdown}
        setShowDropdown={setShowNotificationDropdown}
      />

      {/* Cart */}
      <CartDropdown
        cartCount={cartCount}
        cartItems={cartItems}
        showDropdown={showCartDropdown}
        setShowDropdown={setShowCartDropdown}
      />

      {/* User Profile */}
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