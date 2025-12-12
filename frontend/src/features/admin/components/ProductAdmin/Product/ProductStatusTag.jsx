// src/features/admin/components/ProductStatusTag.jsx
import React from "react";
import { Tag } from "antd";

const ProductStatusTag = ({ status }) => {
  let color = "default";
  let label = "";

  if (status === "approved") {
    color = "green";
    label = "Đã duyệt";
  } else if (status === "pending") {
    color = "gold";
    label = "Chờ duyệt";
  } else if (status === "rejected") {
    color = "red";
    label = "Bị từ chối";
  } else if (status === "banned") {
    color = "grey";
    label = "Đã khoá";
  } else {
    label = "Không rõ";
  }

  return <Tag color={color}>{label}</Tag>;
};

export default ProductStatusTag;
