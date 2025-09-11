import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs } from "antd";
import {
  ClockCircleOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import OrderTab from "./OrderTab";

const { TabPane } = Tabs;

const Orders = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("pending");

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

  return (
    <div className="flex flex-col items-center justify-start min-h-[70vh] mt-10">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm p-6">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarGutter={32}
          tabBarStyle={{ marginBottom: 24 }}
          size="large"
          centered
        >
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                Chờ xác nhận
              </span>
            }
            key="pending"
          >
            <OrderTab status="pending" />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CarOutlined />
                Chờ nhận hàng
              </span>
            }
            key="shipping"
          >
            <OrderTab status="shipping" />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                Đã thanh toán
              </span>
            }
            key="completed"
          >
            <OrderTab status="completed" />
          </TabPane>

          <TabPane
            tab={
              <span>
                <CloseCircleOutlined />
                Đã huỷ
              </span>
            }
            key="cancelled"
          >
            <OrderTab status="cancelled" />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
