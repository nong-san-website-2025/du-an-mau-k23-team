// src/features/admin/components/SellerStatusTag.jsx
import React from "react";
import { Tag } from "antd";

const SellerStatusTag = ({ status }) => {
  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "CHỜ DUYỆT",
      approved: "ĐÃ DUYỆT",
      rejected: "BỊ TỪ CHỐI",
      active: "ĐANG HOẠT ĐỘNG",
      locked: "ĐÃ KHOÁ",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "#faad14",     // Vàng - Chờ duyệt
      approved: "#52c41a",    // Xanh lá - Đã duyệt
      rejected: "#ff4d4f",    // Đỏ - Bị từ chối
      active: "#1890ff",      // Xanh dương - Đang hoạt động
      locked: "#ff7a45",      // Cam - Đã khóa
    };
    return colorMap[status] || "#bfbfbf";
  };

  return (
    <Tag
      style={{
        fontSize: "12px",
        fontWeight: 600,
        padding: "6px 12px",
        backgroundColor: getStatusColor(status),
        color: "#ffffff",
        border: "none",
        borderRadius: "4px",
      }}
    >
      {getStatusLabel(status)}
    </Tag>
  );
};

export default SellerStatusTag;
