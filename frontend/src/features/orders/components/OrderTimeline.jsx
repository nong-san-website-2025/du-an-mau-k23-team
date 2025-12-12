// components/OrderTimeline.jsx
import React from "react";
import { Steps, Space, Typography } from "antd";
import {
  ClockCircleOutlined,
  ShoppingOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { statusMap } from "../utils";

const { Text } = Typography;

const OrderTimeline = ({ status, orderId }) => {
  const statusInfo = statusMap[status];

  if (status === "cancelled") {
    return (
      <div
        style={{
          padding: "16px 20px",
          background: "#fff1f0",
          borderRadius: 8,
          border: "1px solid #ffccc7",
        }}
      >
        <Space>
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
          <Text strong style={{ color: "#ff4d4f" }}>
            Đơn hàng đã bị hủy
          </Text>
        </Space>
      </div>
    );
  }

  const steps = [
    { title: "Chờ xác nhận", icon: <ClockCircleOutlined /> },
    { title: "Chờ lấy hàng", icon: <ShoppingOutlined /> },
    { title: "Đang giao", icon: <TruckOutlined /> },
    { title: "Hoàn thành", icon: <CheckCircleOutlined /> },
  ];

  return (
    <div
      style={{ padding: "20px 16px", background: "#fafafa", borderRadius: 8 }}
    >
      <Steps
        current={statusInfo.step}
        size="small"
        items={steps.map((step, idx) => ({
          title: step.title,
          icon: step.icon,
          status:
            idx < statusInfo.step
              ? "finish"
              : idx === statusInfo.step
              ? "process"
              : "wait",
        }))}
      />
      {orderId && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "#fff",
            borderRadius: 6,
            border: "1px solid #e8e8e8",
          }}
        >
          <Space>
            <Text type="secondary">Mã vận đơn:</Text>
            <Text strong copyable={{ tooltips: ["Sao chép", "Đã sao chép!"] }}>
              VN{String(orderId).padStart(8, "0")}GHN
            </Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;