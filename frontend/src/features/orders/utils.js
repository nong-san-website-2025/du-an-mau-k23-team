// utils.js
import React from "react";
import {
  ClockCircleOutlined,
  ShoppingOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

export const statusMap = {
  pending: {
    label: "Chờ xác nhận",
    color: "gold",
    icon: <ClockCircleOutlined />,
    step: 0,
  },
  shipping: {
    label: "Chờ lấy hàng",
    color: "blue",
    icon: <ShoppingOutlined />,
    step: 1,
  },
  delivery: {
    label: "Đang giao hàng",
    color: "purple",
    icon: <TruckOutlined />,
    step: 2,
  },
  success: {
    label: "Đã giao hàng",
    color: "green",
    icon: <CheckCircleOutlined />,
    step: 3,
  },
  cancelled: {
    label: "Đã huỷ",
    color: "red",
    icon: <CloseCircleOutlined />,
    step: -1,
  },
};

export const cancellableStatuses = new Set(["pending", "shipping"]);

export const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

export const resolveProductImage = (imagePath = "") => {
  if (!imagePath) return "";
  if (imagePath.startsWith("/")) {
    return `http://localhost:8000${imagePath}`;
  }
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  return `http://localhost:8000/media/${imagePath}`;
};