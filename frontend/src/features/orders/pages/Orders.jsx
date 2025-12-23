import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs } from "antd";
import { toast } from "react-toastify";
import OrderTab from "./OrderTab";
import "../styles/css/Order.css"; // Đảm bảo bạn đã lưu file CSS vào đường dẫn này

const Orders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const hasProcessed = useRef(false);

  // Danh sách các Tab
  const tabList = [
    { key: "pending", label: "Chờ xác nhận" },
    { key: "shipping", label: "Chờ giao hàng" },
    { key: "delivered", label: "Đã giao" },
    { key: "completed", label: "Hoàn thành" },
    { key: "return", label: "Trả hàng/Hoàn tiền" },
    { key: "cancelled", label: "Đã huỷ" },
  ];

  // --- 1. Đồng bộ URL với Tab đang chọn ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    
    // Kiểm tra nếu tab trên URL hợp lệ thì set active
    if (tabParam && tabList.some(t => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Hàm chuyển tab và update URL
  const handleTabChange = (key) => {
    setActiveTab(key);
    navigate(`/orders?tab=${key}`, { replace: true });
  };

  // --- 2. Xử lý kết quả thanh toán (Logic cũ) ---
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const status = urlParams.get("status");

    if (status && !hasProcessed.current) {
      hasProcessed.current = true;
      if (status === "success") {
        toast.success("Thanh toán thành công!");
        // Dispatch event để clear giỏ hàng nếu cần
        try {
          const event = new Event("clear-cart");
          window.dispatchEvent(event);
        } catch (e) {
          console.error(e);
        }
      } else if (status === "fail") {
        toast.error("Thanh toán thất bại, vui lòng thử lại.");
      } else if (status === "invalid_signature") {
        toast.error("Xác thực chữ ký không hợp lệ!");
      }
    }
  }, [location.search]);

  return (
    // Áp dụng class container từ CSS của bạn
    <div className="responsive-orders-container">
      {/* Áp dụng class card bao ngoài từ CSS của bạn */}
      <div className="responsive-orders-card">
        <Tabs
          className="custom-tabs" // Áp dụng class style tabs xanh lá
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabList.map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: <OrderTab status={tab.key} />,
          }))}
          size="large"
          // Bỏ margin mặc định để CSS tự xử lý
          tabBarStyle={{ marginBottom: 0 }}
          // Ant Design tự động hỗ trợ scroll trên mobile
        />
      </div>
    </div>
  );
};

export default Orders;