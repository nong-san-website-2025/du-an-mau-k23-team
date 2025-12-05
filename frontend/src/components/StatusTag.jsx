import React from "react";
import { Tag } from "antd";
import { getStatusLabel } from "../constants/statusConstants";

const StatusTag = ({ status }) => {
  // Map trạng thái của bạn sang "Preset" có sẵn của Ant Design
  // Ant Design sẽ tự render kiểu nền nhạt - viền đậm
  const colorMapping = {
    pending: "warning",    // Màu Cam (Gold)
    approved: "success",   // Màu Xanh lá (Green)
    rejected: "error",     // Màu Đỏ (Red)
    active: "processing",  // Màu Xanh dương (Blue)
    locked: "default",     // Màu Xám (Grey) - Hoặc dùng "error" nếu muốn màu đỏ
  };

  return (
    <Tag 
      color={colorMapping[status] || "default"} 
      style={{ margin: 0 }} // Reset margin cho gọn bảng
    >
      {getStatusLabel(status)}
    </Tag>
  );
};

export default StatusTag;