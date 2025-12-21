// src/pages/Orders/Orders.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, Dropdown, Menu } from "antd"; // Import Menu nếu dùng Dropdown
import { EllipsisOutlined } from "@ant-design/icons";
import { toast } from "react-toastify"; 
import OrderTab from "./OrderTab";
import "../styles/css/Order.css";

const { TabPane } = Tabs;

const Orders = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const hasProcessed = useRef(false);

  // --- Đồng bộ trạng thái tab với URL ---
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");
    
    // [MỚI] Thêm 'return' vào danh sách hợp lệ
    const validTabs = ["pending", "shipping", "delivered", "completed", "return", "cancelled"];
    
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // --- Xử lý kết quả thanh toán (Giữ nguyên) ---
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const status = urlParams.get("status");

    if (status && !hasProcessed.current) {
      hasProcessed.current = true; 

      if (status === "success") {
        toast.success("Thanh toán thành công!");
        try {
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

  // --- Handle window resize ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- [MỚI] CẬP NHẬT DANH SÁCH TAB ---
  const tabList = [
    { key: "pending", label: "Chờ xác nhận" },
    { key: "shipping", label: "Chờ giao hàng" },
    { key: "delivered", label: "Đã giao" },
    { key: "completed", label: "Hoàn thành" },
    // Thêm Tab Trả hàng
    { key: "return", label: "Trả hàng/Hoàn tiền" }, 
    { key: "cancelled", label: "Đã huỷ" },
  ];

  // --- [MỚI] Cập nhật Logic Responsive ---
  const getVisibleTabCount = () => {
    if (windowWidth < 576) return 2; // Phone: 2 tabs
    if (windowWidth < 768) return 3; // Tablet nhỏ
    if (windowWidth < 992) return 4; // Tablet lớn
    return 6; // Desktop: hiển thị đủ 6 tabs
  };

  const visibleTabCount = getVisibleTabCount();
  const visibleTabs = tabList.slice(0, visibleTabCount);
  const hiddenTabs = tabList.slice(visibleTabCount);

  // Menu cho Dropdown (nếu có tab bị ẩn)
  const menu = (
    <Menu>
      {hiddenTabs.map((tab) => (
        <Menu.Item key={tab.key} onClick={() => setActiveTab(tab.key)}>
          {tab.label}
        </Menu.Item>
      ))}
    </Menu>
  );

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
          // Render Tab Bar Custom để hỗ trợ Dropdown khi màn hình nhỏ
          renderTabBar={(props, DefaultTabBar) => {
             if (hiddenTabs.length > 0) {
                 return (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center'}}>
                        <DefaultTabBar {...props} style={{marginBottom: 0, flex: 1}} />
                        <Dropdown overlay={menu} trigger={['click']}>
                            <div style={{padding: '0 12px', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center'}}>
                                <EllipsisOutlined style={{fontSize: 20}} />
                            </div>
                        </Dropdown>
                    </div>
                 )
             }
             return <DefaultTabBar {...props} />
          }}
        >
          {/* Render các Tab nhìn thấy được */}
          {visibleTabs.map((tab) => (
            <TabPane tab={tab.label} key={tab.key}>
              <OrderTab status={tab.key} />
            </TabPane>
          ))}
          
          {/* Render các Tab bị ẩn (để nội dung vẫn mount nếu active) */}
          {hiddenTabs.map((tab) => (
             <TabPane tab={null} key={tab.key}> 
                <OrderTab status={tab.key} />
             </TabPane>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;