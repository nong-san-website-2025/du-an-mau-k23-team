import React, { useState, useEffect, useRef } from "react";
import useUserProfile from "../features/users/services/useUserProfile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../features/cart/services/CartContext";
import { useLocation } from "react-router-dom";
import {
  Carrot,
  Apple,
  Wheat,
  Beef,
  Milk,
  Coffee,
  Package,
} from "lucide-react";
import { productApi } from "../features/products/services/productApi";
import axiosInstance from "../features/admin/services/axiosInstance";

// Local components
import TopBar from "./Header/TopBar";
import Logo from "./Header/Logo";
import CategoryMegaMenu from "./Header/CategoryMegaMenu";
import NavLinks from "./Header/NavLinks";
import SearchBoxWithSuggestions from "./Header/SearchBoxWithSuggestions";
import UserActions from "./Header/UserActions";

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
  // Cart & user
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const { cartItems } = useCart();
  const cartCount = cartItems.length;
  const userProfile = useUserProfile();

  // Dropdown visibility
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);

  // Notifications (kept for future use/compatibility)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Đơn hàng #1234 đã được xác nhận",
      detail: "Chi tiết đơn hàng #1234...",
      thumbnail: "/media/cart_items/order-confirmed.png",
    },
    {
      id: 2,
      title: "Bạn nhận được voucher mới",
      detail: "Bạn vừa nhận được voucher giảm giá 10%...",
      thumbnail: "/media/cart_items/voucher.png",
    },
    {
      id: 3,
      title: "Cập nhật chính sách vận chuyển",
      detail: "Chính sách vận chuyển mới áp dụng từ 8/8...",
      thumbnail: "/media/cart_items/policy-update.png",
    },
  ]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    sessionStorage.clear();
    setShowProfileDropdown(false);
    window.location.replace("/login");
  };

  // Categories & mega menu
  const [showCategory, setShowCategory] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const [leaveTimeout, setLeaveTimeout] = useState(null);

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

  const greenText = {
    color: "#22C55E",
    fontFamily: "Montserrat, Arial, sans-serif",
    fontWeight: 800,
  };

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

  // Search feature
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState({
    products: [],
    posts: [],
  });
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
        const res = await axiosInstance.get(`/products/search/`, {
          params: { q: value },
        });
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

  // Seller status & store
  const [storeName, setStoreName] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null); // "pending" | "approved" | "rejected" | null

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let intervalId;

    const fetchSellerStatus = async () => {
      try {
        let seller = null;
        // Try dedicated endpoint first
        try {
          const resMe = await axiosInstance.get(`/sellers/me/`);
          seller = resMe.data;
        } catch {
          // Fallback: filter list by username
          const res = await axiosInstance.get(`/sellers/`);
          const username = localStorage.getItem("username");
          const list = Array.isArray(res.data) ? res.data : [];
          seller = list.find(
            (s) =>
              (s.user_name || s.owner_name || s.user)?.toLowerCase() ===
              username?.toLowerCase()
          );
        }

        if (seller) {
          const status = (seller.status || "").toLowerCase();
          if (status === "approved" || status === "đã duyệt") {
            // Seller đã được duyệt nhưng chưa active
            setStoreName(seller.store_name || "");
            setSellerStatus("approved");
          } else if (status === "active") {
            // Seller đang hoạt động
            setStoreName(seller.store_name || "");
            setSellerStatus("active");
          } else if (status === "pending" || status === "chờ duyệt") {
            setSellerStatus("pending");
            setStoreName("");
          } else if (status === "rejected" || status === "đã từ chối") {
            setSellerStatus("rejected");
            setStoreName("");
          } else {
            setSellerStatus(null);
            setStoreName("");
          }
        } else {
          setSellerStatus(null);
          setStoreName("");
        }
      } catch {
        setSellerStatus(null);
      }
    };

    fetchSellerStatus();
    intervalId = setInterval(fetchSellerStatus, 10000); // poll every 10s to reflect admin approval

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
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
        style={{
          position: "sticky",
          top: 0,
          zIndex: 999,
          fontFamily: "Montserrat, Arial, sans-serif",
          background: "#f8fafc",
        }}
      >
        {/* Top bar */}
        <TopBar />

        {/* Main header */}
        <div
          className="bg-white border-bottom"
          style={{ position: "relative", boxShadow: "0 2px 8px #0001" }}
        >
          <div
            className="container d-flex align-items-center justify-content-between py-2 px-2"
            style={{ minHeight: "60px", flexWrap: "nowrap" }}
          >
            {/* Logo */}
            <Logo greenText={greenText} />

            {/* Navigation */}
            <nav
              className="d-flex align-items-center flex-grow-1 ms-4"
              style={{ flexWrap: "nowrap" }}
            >
              <CategoryMegaMenu
                categories={categories}
                iconMap={iconMap}
                showCategory={showCategory}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
                handleCategoryHover={handleCategoryHover}
                setShowCategory={setShowCategory}
              />
              <NavLinks />
            </nav>

            {/* Search & Actions */}
            <SearchBoxWithSuggestions
              search={search}
              setShowSuggestions={setShowSuggestions}
              showSuggestions={showSuggestions}
              searchResults={searchResults}
              handleSearchChange={handleSearchChange}
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
              notifications={notifications}
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
