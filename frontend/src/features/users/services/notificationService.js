import axiosInstance from "../../admin/services/axiosInstance";
import API from "../../login_register/services/api"; // Giữ lại nếu bro dùng API thay cho axiosInstance

// --- CÁC HÀM HELPER ---
const safeToDateString = (v) => {
  try {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
  } catch {
    return "";
  }
};

// --- 1. HÀM FETCH CHÍNH (fetchUnifiedNotifications) ---
export async function fetchUnifiedNotifications(userId) {
  try {
    // Gọi đến endpoint lấy thông báo của người dùng
    const res = await axiosInstance.get("/notifications/"); 
    
    // Django trả về mảng hoặc object có .results (nếu có phân trang)
    const rawData = Array.isArray(res.data) ? res.data : (res.data.results || []);

    // Map lại dữ liệu để UI dễ đọc
    return rawData.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      detail: n.detail,
      read: n.is_read, // Django dùng is_read
      time: safeToDateString(n.created_at),
      ts: new Date(n.created_at).getTime(),
      metadata: n.metadata || {},
      thumbnail: n.metadata?.product_image || null,
    }));
  } catch (error) {
    console.error("[NotificationService] Lỗi khi lấy thông báo:", error);
    return [];
  }
}

// --- 2. HÀM ĐÁNH DẤU ĐÃ ĐỌC (markAllAsRead) ---
export async function markAllAsRead(userId) {
  if (!userId) return;
  try {
    // Gọi API để backend cập nhật database
    await axiosInstance.post(`/notifications/mark_all_as_read/`);
  } catch (error) {
    console.error("[NotificationService] Lỗi khi đánh dấu đã đọc:", error);
  }
}

// --- 3. HÀM ANNOTATE (Dùng để xử lý nhanh trạng thái đọc/chưa đọc ở UI) ---
export function annotateRead(list, userId) {
  if (!list) return [];
  return list.map((n) => ({
    ...n,
    // Ưu tiên is_read từ backend, nếu không có thì mặc định false
    read: n.is_read !== undefined ? n.is_read : (n.read || false),
  }));
}

export default {
  fetchUnifiedNotifications,
  markAllAsRead,
  annotateRead,
};