import React from "react";
import { Tag } from "antd";
import { getStatusLabel } from "../constants/statusConstants";

const StatusTag = ({ status, label }) => { // Thêm props label để linh hoạt
  // Map trạng thái sang "Preset" có sẵn của Ant Design
  const colorMapping = {
    // --- KHỐI CŨ (User/General) ---
    pending: "warning",    // Màu Cam (Gold)
    approved: "success",   // Màu Xanh lá (Green)
    rejected: "error",     // Màu Đỏ (Red)
    active: "processing",  // Màu Xanh dương (Blue)
    locked: "default",     // Màu Xám (Grey)

    // --- KHỐI MỚI THÊM (Order) ---
    processing: "processing", // Đang xử lý (Xanh dương)
    shipping: "geekblue",     // Đang vận chuyển (Xanh đậm - Geekblue)
    shipped: "geekblue",      // Đã giao vận (Xanh đậm)
    delivered: "success",     // Đã giao hàng (Xanh lá)
    success: "success",       // Hoàn thành (Xanh lá)
    cancelled: "error",       // Đã hủy (Đỏ - giống rejected)
    refunded: "magenta",      // Đã hoàn tiền (Tím - Magenta để nổi bật tiền nong)
  };

 const displayText = label || getStatusLabel(status);

  return (
    <Tag 
      color={colorMapping[status] || "default"} 
      style={{ margin: 0 }} // Giữ nguyên style cũ
    >
      {displayText}
    </Tag>
  );
};

export default StatusTag;