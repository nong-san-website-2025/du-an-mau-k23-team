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
  SafetyCertificateOutlined, // Icon cho Admin/Sàn
  CommentOutlined,           // Icon cho Thương lượng
  RollbackOutlined           // Icon cho Trả hàng
} from "@ant-design/icons";

/**
 * StatusTag - Component hiển thị trạng thái chuẩn UI/UX
 * @param {string} status - Key trạng thái (vd: pending, approved)
 * @param {string} type - Loại nghiệp vụ: 'status' | 'availability' | 'order' | 'complaint'
 * @param {string} label - (Optional) Text hiển thị đè lên mặc định
 */
const StatusTag = ({ status, type = "status", label }) => {

  // 1. Config cho trạng thái Duyệt / Hệ thống
  const statusConfig = {
    pending: { color: "gold", text: "Chờ duyệt", icon: <ClockCircleOutlined /> },
    approved: { color: "success", text: "Đã duyệt", icon: <CheckCircleOutlined /> },
    rejected: { color: "error", text: "Từ chối", icon: <CloseCircleOutlined /> },
    self_rejected: { color: "magenta", text: "Đã hủy yêu cầu", icon: <StopOutlined /> },
    active: { color: "blue", text: "Hoạt động", icon: <CheckCircleOutlined /> },
    banned: { color: "default", text: "Đã khoá", icon: <StopOutlined /> },
    locked: { color: "default", text: "Tạm khóa", icon: <ExclamationCircleOutlined /> },
    pending_update: { color: "orange", text: "Chờ duyệt C.nhật", icon: <HistoryOutlined /> },
    hidden: { color: "default", text: "Đang ẩn", icon: <EyeInvisibleOutlined /> },
  };

  // 2. Config cho trạng thái Tồn kho / Sản phẩm
  const availabilityConfig = {
    available: { color: "cyan", text: "Có sẵn", icon: <CheckCircleOutlined /> },
    coming_soon: { color: "purple", text: "Sắp có / Mùa vụ", icon: <ClockCircleOutlined /> },
    out_of_stock: { color: "red", text: "Hết hàng", icon: <MinusCircleOutlined /> },
    pre_order: { color: "geekblue", text: "Đặt trước", icon: <InboxOutlined /> },
  };

  // 3. Config cho trạng thái Đơn hàng
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

  // 4. [MỚI] Config cho trạng thái Khiếu nại / Trả hàng (Khớp với Django Model)
  const complaintConfig = {
    pending: { color: "gold", text: "Chờ Shop phản hồi", icon: <ClockCircleOutlined /> },
    negotiating: { color: "orange", text: "Đang thương lượng", icon: <CommentOutlined /> },
    
    waiting_return: { color: "cyan", text: "Chờ gửi hàng về", icon: <InboxOutlined /> },
    returning: { color: "geekblue", text: "Đang vận chuyển", icon: <CarOutlined /> },
    
    admin_review: { color: "volcano", text: "Sàn đang xem xét", icon: <SafetyCertificateOutlined /> },
    
    resolved_refund: { color: "success", text: "Đã hoàn tiền", icon: <CheckCircleOutlined /> },
    resolved_reject: { color: "error", text: "Từ chối hoàn tiền", icon: <CloseCircleOutlined /> },
    
    cancelled: { color: "default", text: "Đã hủy khiếu nại", icon: <StopOutlined /> },
    rejected: { color: "error", text: "Đã từ chối", icon: <CloseCircleOutlined /> }, // Fallback cho code cũ
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
    case "complaint": // <--- Thêm case này
      selectedConfig = complaintConfig;
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
        gap: 4, // Tăng gap lên chút cho thoáng
        textTransform: 'capitalize' // Viết hoa chữ cái đầu nếu fallback về tiếng Anh
      }}
    >
      {label || current.text}
    </Tag>
  );
};

export default StatusTag;