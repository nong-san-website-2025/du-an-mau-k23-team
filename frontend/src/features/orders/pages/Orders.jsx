import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, Dropdown } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { toast } from "react-toastify"; // ✅ thêm
import OrderTab from "./OrderTab";
import "../styles/css/Order.css";

const { TabPane } = Tabs;

const Orders = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const hasProcessed = useRef(false);

  // Đồng bộ trạng thái tab với URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");
    if (
      tabParam &&
      ["pending", "shipping", "delivery", "completed", "cancelled"].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const status = urlParams.get("status");

    if (status && !hasProcessed.current) {
      hasProcessed.current = true; // ✅ ngăn gọi lại nhiều lần

      if (status === "success") {
        toast.success("Thanh toán thành công!");
        try {
          // Clear cart client-side sau khi thanh toán thành công
          const event = new Event("clear-cart");
          window.dispatchEvent(event);
        } catch (e) {}
      } else if (status === "fail") {
        toast.error("Thanh toán thất bại, vui lòng thử lại.");
      } else if (status === "invalid_signature") {
        toast.error("Xác thực chữ ký không hợp lệ!");
      }
    }
  }, [location.search]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabList = [
    { key: "pending", label: "Chờ xác nhận" },
    { key: "shipping", label: "Chờ lấy hàng" },
    { key: "delivered", label: "Chờ giao hàng" },
    { key: "completed", label: "Đã nhận hàng" },
    { key: "cancelled", label: "Đã huỷ" },
  ];

  // Responsive tab logic
  const getVisibleTabCount = () => {
    if (windowWidth < 576) return 2; // Phone: 2 tabs
    if (windowWidth < 992) return 3; // Tablet/iPad: 3 tabs
    return 5; // Desktop: all tabs
  };

  const visibleTabCount = getVisibleTabCount();
  const visibleTabs = tabList.slice(0, visibleTabCount);
  const hiddenTabs = tabList.slice(visibleTabCount);

  const dropdownItems = hiddenTabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    onClick: () => setActiveTab(tab.key),
  }));

  const isSmallScreen = windowWidth < 480;
  const isMobile = windowWidth < 576;
  const isTablet = windowWidth >= 576 && windowWidth < 992;

  return (
    <div
      className="flex flex-col items-center justify-start min-h-[70vh] mt-0 responsive-orders-container"
      style={{
        padding: isSmallScreen
          ? "0px 8px"
          : isMobile
            ? "0px 16px"
            : isTablet
              ? "0px 32px"
              : "0px 120px",
      }}
    >
      <div
        className={`w-full bg-white rounded-xl shadow-sm responsive-orders-card ${
          isSmallScreen ? "p-3" : isMobile ? "p-4" : "p-6"
        }`}
        style={{
          maxWidth: isSmallScreen
            ? "100%"
            : isMobile
              ? "100%"
              : isTablet
                ? "900px"
                : "1100px",
          maxHeight: "100%",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarGutter={isMobile ? 16 : isTablet ? 24 : 32}
          tabBarStyle={{ marginBottom: 6 }}
          size={isMobile ? "small" : "large"}
          centered={!isMobile}
          className="custom-tabs"
        >
          {tabList.map((tab) => (
            <TabPane tab={tab.label} key={tab.key}>
              <OrderTab status={tab.key} />
            </TabPane>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
