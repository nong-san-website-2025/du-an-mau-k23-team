// src/features/admin/components/SellerStatusTag.jsx
import React from "react";
import { Tag } from "antd";

const SellerStatusTag = ({ status }) => {
  let color = "default";
  let label = "";

  switch (status) {
    case "pending":
      color = "gold";
      label = "Chờ duyệt";
      break;
    case "approved":
      color = "green";
      label = "Đã duyệt";
      break;
    case "active":
      color = "blue";
      label = "Đang hoạt động";
      break;
    case "rejected":
      color = "red";
      label = "Bị từ chối";
      break;
    case "locked":
      color = "volcano";
      label = "Bị khóa";
      break;
    default:
      label = status;
  }

  return <Tag color={color}>{label}</Tag>;
};

export default SellerStatusTag;
