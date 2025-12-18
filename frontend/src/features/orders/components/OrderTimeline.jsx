import React from "react";
import { Steps, Space, Typography } from "antd";
import {
  ClockCircleOutlined,
  ShoppingOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined // Icon cho trả hàng
} from "@ant-design/icons";
import { statusMap } from "../utils";

const { Text } = Typography;

const OrderTimeline = ({ status, orderId }) => {
  // --- 1. Xử lý các trạng thái thất bại (Hủy / Trả hàng) ---
  if (status === "cancelled" || status === "returned") {
    const isReturned = status === "returned";
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
          {isReturned ? (
            <RollbackOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
          ) : (
            <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
          )}
          <Text strong style={{ color: "#ff4d4f" }}>
            {isReturned ? "Đơn hàng đã Trả hàng / Hoàn tiền" : "Đơn hàng đã bị hủy"}
          </Text>
        </Space>
      </div>
    );
  }

  // --- 2. Định nghĩa các bước (Steps) ---
  const steps = [
    { title: "Chờ xác nhận", icon: <ClockCircleOutlined /> }, // Index 0
    { title: "Chờ lấy hàng", icon: <ShoppingOutlined /> },    // Index 1
    { title: "Đang giao", icon: <TruckOutlined /> },          // Index 2
    { title: "Hoàn thành", icon: <CheckCircleOutlined /> },   // Index 3
  ];

  // --- 3. Logic lấy Step Index an toàn (Fix lỗi undefined) ---
  let currentStep = 0;

  // Nếu trong statusMap có định nghĩa thì dùng, không thì tự map thủ công
  if (statusMap && statusMap[status]) {
    currentStep = statusMap[status].step;
  } else {
    // Fallback cho các status mới từ Backend chưa có trong utils.js
    if (status === "completed") currentStep = 3; // Hoàn thành
    else if (status === "delivered") currentStep = 3; // Đã giao -> Coi như hoàn thành timeline
    else if (status === "shipping") currentStep = 2; // Đang giao
    else if (status === "confirmed") currentStep = 1; // Đã xác nhận/Chờ lấy
    else currentStep = 0; // Mặc định là Pending
  }

  return (
    <div
      style={{ padding: "20px 16px", background: "#fafafa", borderRadius: 8 }}
    >
      <Steps
        current={currentStep}
        size="small"
        items={steps.map((step, idx) => ({
          title: step.title,
          icon: step.icon,
          // Logic hiển thị màu:
          // - Những bước nhỏ hơn bước hiện tại: finish (xanh)
          // - Bước hiện tại: process (xanh đậm/đang chạy)
          // - Bước chưa tới: wait (xám)
          status:
            idx < currentStep
              ? "finish"
              : idx === currentStep
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