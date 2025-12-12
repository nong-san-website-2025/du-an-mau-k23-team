// 1. Định nghĩa các KEY ở một nơi duy nhất (Enum)
export const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  ACTIVE: "active",
  LOCKED: "locked",
};

// 2. Dùng biến STATUS làm key, tránh gõ tay
export const STATUS_LABELS = {
  [STATUS.PENDING]: "Chờ duyệt",
  [STATUS.APPROVED]: "Đã duyệt",
  [STATUS.REJECTED]: "Từ chối",
  [STATUS.ACTIVE]: "Đang hoạt động",
  [STATUS.LOCKED]: "Đã khoá",
};

export const STATUS_COLORS = {
  [STATUS.PENDING]: "#faad14",
  [STATUS.APPROVED]: "#52c41a",
  [STATUS.REJECTED]: "#ff4d4f",
  [STATUS.ACTIVE]: "#1890ff",
  [STATUS.LOCKED]: "#9E9E9E", // Mình thích màu xám này
};

// Hàm get giữ nguyên
export const getStatusLabel = (status) => STATUS_LABELS[status] || status;
export const getStatusColor = (status) => STATUS_COLORS[status] || "#bfbfbf";