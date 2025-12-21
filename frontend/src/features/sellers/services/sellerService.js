// services/sellerService.js

// Lấy API URL từ biến môi trường
const API_URL = process.env.REACT_APP_API_URL;

// Helper để lấy token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function registerSeller(form) {
  const formData = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== "") formData.append(key, value);
  });

  // Lưu ý: Khi gửi FormData, KHÔNG set 'Content-Type': 'application/json'
  // Fetch sẽ tự động set boundary cho multipart/form-data
  const res = await fetch(`${API_URL}/sellers/register/`, {
    method: "POST",
    body: formData,
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || "Đăng ký thất bại");
  }
  return await res.json();
}

export async function getPendingSellers() {
  // Thêm header auth vì đây là chức năng của Admin
  const res = await fetch(`${API_URL}/sellers/pending/`, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Không lấy được danh sách chờ duyệt");
  return await res.json();
}

export async function approveSeller(sellerId) {
  const res = await fetch(`${API_URL}/sellers/${sellerId}/approve/`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Duyệt cửa hàng thất bại");
  return await res.json();
}

export async function rejectSeller(sellerId) {
  const res = await fetch(`${API_URL}/sellers/${sellerId}/reject/`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Từ chối cửa hàng thất bại");
  return await res.json();
}

export async function getSellerDetail(sellerId) {
  const res = await fetch(`${API_URL}/sellers/${sellerId}/`, {
    headers: {
      ...getAuthHeaders(), // Thêm auth để xem chi tiết nếu cần quyền
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Không lấy được thông tin cửa hàng");
  return await res.json();
}

// Bổ sung: Lấy thông tin Seller của chính user đang đăng nhập
export async function getMySellerProfile() {
  const res = await fetch(`${API_URL}/sellers/me/`, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // Nếu 404 nghĩa là user chưa đăng ký seller
    if (res.status === 404) return null;
    throw new Error("Lỗi lấy thông tin cửa hàng cá nhân");
  }
  return await res.json();
}

// Bổ sung: Cập nhật thông tin cửa hàng
export async function updateSeller(sellerId, data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    // Chỉ append những giá trị có thực, hoặc xử lý file
    if (value !== undefined && value !== null) {
        formData.append(key, value);
    }
  });

  const res = await fetch(`${API_URL}/sellers/${sellerId}/`, {
    method: "PATCH", // Hoặc PUT tùy backend
    body: formData,
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Cập nhật cửa hàng thất bại");
  }
  return await res.json();
}