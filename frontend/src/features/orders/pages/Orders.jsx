import React, { useState, useEffect, useRef  } from "react";
import { useLocation} from "react-router-dom";
import { Tabs, Dropdown } from "antd";
import { toast } from "react-toastify"; // ✅ thêm
import OrderTab from "./OrderTab";

const { TabPane } = Tabs;

const TAB_CONFIG = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "shipping", label: "Chờ lấy hàng" },
  { key: "delivery", label: "Chờ giao hàng" },
  { key: "completed", label: "Đã nhận hàng" },
  { key: "cancelled", label: "Đã huỷ" }
];

const Orders = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const isMobile = windowWidth < 480;
  const hasProcessed = useRef(false);

  const shouldCollapseToMenu = windowWidth < 1024;
  const visibleTabsCount = shouldCollapseToMenu ? 3 : TAB_CONFIG.length;
  const visibleTabs = TAB_CONFIG.slice(0, visibleTabsCount);
  const overflowTabs = TAB_CONFIG.slice(visibleTabsCount);

  const tabBarGutter = (() => {
    if (isMobile) return 12;
    if (windowWidth < 640) return 16;
    if (windowWidth < 768) return 20;
    if (windowWidth < 900) return 24;
    if (windowWidth < 1100) return 32;
    if (windowWidth < 1440) return 48;
    return 64;
  })();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Đồng bộ trạng thái tab với URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");
    if (
      tabParam &&
      ["pending", "shipping", "completed", "cancelled"].includes(tabParam)
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

  const menuItems = overflowTabs.map(tab => ({
    key: tab.key,
    label: tab.label,
    onClick: () => setActiveTab(tab.key)
  }));

  const dropdownMenu = { items: menuItems };

  const isActiveInOverflow = overflowTabs.some(tab => tab.key === activeTab);
  const effectiveActiveKey = shouldCollapseToMenu && isActiveInOverflow ? "more" : activeTab;

  const handleTabChange = key => {
    if (key === "more" && overflowTabs.length > 0) {
      // Keep the currently active status when clicking more tab directly
      return;
    }
    setActiveTab(key);
  };

  return (
    <div
      className="flex flex-col items-center justify-start min-h-[70vh] mt-0 orders-page-container"
    >
      <div
        className="w-full max-w-5xl bg-white rounded-xl shadow-sm p-6"
        style={{ maxHeight: "100%" }}
      >
        <Tabs
          activeKey={effectiveActiveKey}
          onChange={handleTabChange}
          className="orders-tabs"
          tabBarGutter={tabBarGutter}
          tabBarStyle={{ marginBottom: 6 }}
          size="large"
          centered={!shouldCollapseToMenu}
        >
          {visibleTabs.map(tab => (
            <TabPane tab={<span>{tab.label}</span>} key={tab.key}>
              <OrderTab status={tab.key} />
            </TabPane>
          ))}

<<<<<<< Updated upstream
          <TabPane tab={<span>Chờ nhận hàng</span>} key="shipping">
            <OrderTab status="shipping" />
          </TabPane>

          <TabPane tab={<span>Đã nhận hàng</span>} key="completed">
            <OrderTab status="completed" />
          </TabPane>

          <TabPane tab={<span>Đã huỷ</span>} key="cancelled">
            <OrderTab status="cancelled" />
          </TabPane>
=======
          {shouldCollapseToMenu && overflowTabs.length > 0 && (
            <TabPane
              tab={
                <Dropdown menu={dropdownMenu} trigger={["click"]}>
                  <span
                    style={{
                      cursor: "pointer",
                      fontSize: 20,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1
                    }}
                  >
                    …
                  </span>
                </Dropdown>
              }
              key="more"
            >
              <OrderTab status={activeTab} />
            </TabPane>
          )}
>>>>>>> Stashed changes
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
