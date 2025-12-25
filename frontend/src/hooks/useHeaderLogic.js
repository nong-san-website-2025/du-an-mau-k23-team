// hooks/useHeaderLogic.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd"; // Import Ant Design
import { useAuth } from "../features/login_register/services/AuthContext";
import axiosInstance from "../features/admin/services/axiosInstance";

export const useHeaderLogic = () => {
  const [popularItems, setPopularItems] = useState([]);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Ant Design Notification Instance
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const fetchPopularItems = async () => {
      try {
        const res = await axiosInstance.get("/search/popular-items/");
        const data = res?.data || {};
        setPopularItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error("Failed to load popular items", err);
      }
    };
    fetchPopularItems();
  }, []);

  const handleLogout = async (setShowProfileDropdown) => {
    try {
      await logout();
      setShowProfileDropdown(false);
      navigate("/login", { replace: true });
      api.success({
        message: 'Đăng xuất thành công',
        description: 'Hẹn gặp lại bạn!',
        placement: 'topRight',
      });
    } catch (error) {
      api.error({
        message: 'Lỗi',
        description: 'Không thể đăng xuất. Vui lòng thử lại.',
      });
    }
  };

  const handlePopularItemClick = (e, item) => {
    e.preventDefault();
    if (item.type === "product") {
      navigate(`/products/${item.id}`);
    } else if (item.type === "category") {
      navigate(`/products?category=${encodeURIComponent(item.name)}`);
    }
  };

  return {
    popularItems,
    handleLogout,
    handlePopularItemClick,
    navigate,
    contextHolder // Trả về để render notification
  };
};