import React, { useState, useEffect, useRef  } from "react";
import { useLocation} from "react-router-dom";
import { Tabs } from "antd";
import { toast } from "react-toastify"; // ✅ thêm
import OrderTab from "./OrderTab";

const { TabPane } = Tabs;

const Orders = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const hasProcessed = useRef(false);

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

  return (
    <div
      className="flex flex-col items-center justify-start min-h-[70vh] mt-0"
      style={{ padding: "0px 120px" }}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-xl shadow-sm p-6"
        style={{ maxHeight: "100%" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarGutter={256}
          tabBarStyle={{ marginBottom: 6 }}
          size="large"
          centered
        >
          <TabPane tab={<span>Chờ xác nhận</span>} key="pending">
            <OrderTab status="pending" />
          </TabPane>

          <TabPane tab={<span>Chờ nhận hàng</span>} key="shipping">
            <OrderTab status="shipping" />
          </TabPane>

          <TabPane tab={<span>Đã nhận hàng</span>} key="completed">
            <OrderTab status="completed" />
          </TabPane>

          <TabPane tab={<span>Đã huỷ</span>} key="cancelled">
            <OrderTab status="cancelled" />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
