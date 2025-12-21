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

// Logic xử lý URL ảnh với biến môi trường
export const resolveProductImage = (imagePath = "") => {
  if (!imagePath) return "";

  // Lấy API URL từ env, ví dụ: http://localhost:8000/api
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  
  // Tạo Base URL bằng cách bỏ '/api' ở cuối
  // Kết quả: http://localhost:8000
  const BASE_URL = API_URL.replace(/\/api\/?$/, "");

  // Trường hợp 1: Đường dẫn tương đối bắt đầu bằng / (ví dụ: /media/anh.jpg)
  if (imagePath.startsWith("/")) {
    return `${BASE_URL}${imagePath}`;
  }

  // Trường hợp 2: Đường dẫn tuyệt đối (ví dụ: https://cloudinary.com/...)
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Trường hợp 3: Tên file thuần túy (ví dụ: anh.jpg) -> Gán mặc định vào /media/
  return `${BASE_URL}/media/${imagePath}`;
};