import React from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  CarOutlined,
  InboxOutlined,
  MinusCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";

/**
 * StatusTag - Component hiển thị trạng thái chuẩn UI/UX
 * @param {string} status - Key trạng thái (vd: pending, approved)
 * @param {string} type - Loại nghiệp vụ: 'status' (mặc định) | 'availability' | 'order'
 * @param {string} label - (Optional) Text hiển thị đè lên mặc định
 */
const StatusTag = ({ status, type = "status", label }) => {

  // 1. Config cho trạng thái Duyệt / Hệ thống (type="status")
  const statusConfig = {
    pending: { color: "gold", text: "Chờ duyệt", icon: <ClockCircleOutlined /> },
    approved: { color: "success", text: "Đã duyệt", icon: <CheckCircleOutlined /> },
    rejected: { color: "error", text: "Từ chối", icon: <CloseCircleOutlined /> },
    self_rejected: { color: "magenta", text: "Đã hủy yêu cầu", icon: <StopOutlined /> },
    active: { color: "blue", text: "Hoạt động", icon: <CheckCircleOutlined /> },
    banned: { color: "default", text: "Đã khoá", icon: <StopOutlined /> },
    locked: { color: "default", text: "Tạm khóa", icon: <ExclamationCircleOutlined /> },
    pending_update: { color: "orange", text: "Chờ duyệt C.nhật", icon: <HistoryOutlined /> }, // Thêm trạng thái này nếu muốn dùng StatusTag chính thay vì Tag custom
    hidden: { color: "default", text: "Đang ẩn", icon: <EyeInvisibleOutlined /> },
  };

  // 2. Config cho trạng thái Tồn kho / Sản phẩm (type="availability")
  const availabilityConfig = {
    available: { color: "cyan", text: "Có sẵn", icon: <CheckCircleOutlined /> },
    coming_soon: { color: "purple", text: "Sắp có / Mùa vụ", icon: <ClockCircleOutlined /> },
    out_of_stock: { color: "red", text: "Hết hàng", icon: <MinusCircleOutlined /> },
    pre_order: { color: "geekblue", text: "Đặt trước", icon: <InboxOutlined /> },
  };

  // 3. Config cho trạng thái Đơn hàng (type="order")
  const orderConfig = {
    pending: { color: "gold", text: "Chờ xác nhận", icon: <ClockCircleOutlined /> },
    processing: { color: "blue", text: "Đang xử lý", icon: <SyncOutlined spin /> },
    shipping: { color: "geekblue", text: "Đang giao", icon: <CarOutlined /> },
    shipped: { color: "cyan", text: "Đã giao vận", icon: <InboxOutlined /> },
    delivered: { color: "success", text: "Giao thành công", icon: <CheckCircleOutlined /> },
    cancelled: { color: "error", text: "Đã hủy", icon: <CloseCircleOutlined /> },
    refunded: { color: "magenta", text: "Đã hoàn tiền", icon: <DollarOutlined /> },
    failed: { color: "red", text: "Giao thất bại", icon: <StopOutlined /> },
  };

  // Chọn bộ config dựa trên props `type`
  let selectedConfig;
  switch (type) {
    case "availability":
      selectedConfig = availabilityConfig;
      break;
    case "order":
      selectedConfig = orderConfig;
      break;
    default:
      selectedConfig = statusConfig;
  }

  // Lấy config cụ thể, nếu không có thì fallback về default
  const current = selectedConfig[status] || {
    color: "default",
    text: status, // Fallback text là chính status key nếu không tìm thấy
    icon: null,
  };

  return (
    <Tag
      color={current.color}
      icon={current.icon}
      style={{
        borderRadius: 4,
        margin: 0,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
      }}
    >
      {label || current.text}
    </Tag>
  );
};

export default StatusTag;