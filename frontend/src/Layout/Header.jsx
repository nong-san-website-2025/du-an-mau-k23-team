import React, { useState, useEffect, useRef } from "react";
import useUserProfile from "../features/users/services/useUserProfile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../features/cart/services/CartContext";
import { useLocation, useNavigate } from "react-router-dom";
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

import Logo from "./Header/Logo";
import SearchBoxWithSuggestions from "./Header/SearchBoxWithSuggestions";
import UserActions from "./Header/UserActions";
import TopBar from "./Header/TopBar";

const iconMap = {
  Carrot: Carrot,
  Apple: Apple,
  Wheat: Wheat,
  Beef: Beef,
  Milk: Milk,
  Coffee: Coffee,
  Package: Package,
};

export default function Header({ shouldFetchProfile = true }) {
  const userProfile = useUserProfile(shouldFetchProfile);
  // Cart & user
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const { cartItems } = useCart();
  const cartCount = cartItems.length;

  // Dropdown visibility
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const navigate = useNavigate();

  // Notifications (kept for future use/compatibility)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("first_name");
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
    color: "#4caf50",
    fontFamily: "Montserrat, Arial, sans-serif",
    fontWeight: 800,
  };

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
    localStorage.setItem("searchValue", value); // Lưu vào localStorage

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

  const handleSearchSubmit = async () => {
    if (!search.trim()) return;

    try {
      const res = await axiosInstance.get(`/products/search/`, {
        params: { q: search },
      });
      setSearchResults(res.data);
      setShowSuggestions(false);

      // Điều hướng sang trang /search?query=...
      navigate(`/search?query=${encodeURIComponent(search)}`);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Seller status & store
  const [storeName, setStoreName] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null); // "pending" | "approved" | "rejected" | null

  useEffect(() => {
    if (!shouldFetchProfile) return;
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
  }, [shouldFetchProfile]);

  useEffect(() => {
    const savedSearch = localStorage.getItem("searchValue");
    if (savedSearch) {
      setSearch(savedSearch);
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
        style={{
          position: "sticky",
          top: 0,
          zIndex: 999,
          fontFamily: "Montserrat, Arial, sans-serif",
          background: "#2E7D32", // Nền xanh chạy full width
          width: "100%",
        }}
      >
        {/* Top bar */}
        <TopBar />
        {/* <TopBar /> */}

        {/* Main header */}
        <div
          className="border-bottom"
          style={{
            position: "relative",
            background: "linear-gradient(to bottom, #2E7D32 0%, #4CAF50 100%)",
            padding: "0 180px",
          }}
        >
          <div
            className="container-fluid d-flex align-items-center justify-content-between py-1 px-1"
            style={{ minHeight: "60px", flexWrap: "nowrap" }}
          >
            {/* Logo */}
            <Logo greenText={greenText} />

            {/* Search & Actions */}
            <SearchBoxWithSuggestions
              search={search}
              setSearch={setSearch} // ✅ Thêm prop này
              setShowSuggestions={setShowSuggestions}
              showSuggestions={showSuggestions}
              searchResults={searchResults}
              handleSearchChange={handleSearchChange}
              handleSearchSubmit={handleSearchSubmit} // ✅ Thêm prop này
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
