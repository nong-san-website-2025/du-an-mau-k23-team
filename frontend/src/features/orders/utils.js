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
    label: "Đang vận chuyển",
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
  delivered: {
    label: "Đã giao hàng",
    color: "cyan",
    icon: <TruckOutlined />,
    step: 2,
  },
  completed: {
    label: "Hoàn thành",
    color: "green",
    icon: <CheckCircleOutlined />,
    step: 3,
  },
  returned: {
    label: "Trả hàng/Hoàn tiền",
    color: "orange",
    icon: <CloseCircleOutlined />,
    step: -1,
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