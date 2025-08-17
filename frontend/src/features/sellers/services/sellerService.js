// services/sellerService.js

export async function registerSeller(form) {
  const formData = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== "") formData.append(key, value);
  });
  // Lấy token từ localStorage (hoặc context nếu dùng)
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch("http://localhost:8000/api/sellers/register/", {
    method: "POST",
    body: formData,
    headers,
  });
  if (!res.ok) throw new Error("Đăng ký thất bại");
  return await res.json();
}

export async function getPendingSellers() {
  const res = await fetch("http://localhost:8000/api/sellers/pending/");
  if (!res.ok) throw new Error("Không lấy được danh sách chờ duyệt");
  return await res.json();
}

export async function approveSeller(sellerId) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`http://localhost:8000/api/sellers/${sellerId}/approve/`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Duyệt cửa hàng thất bại");
  return await res.json();
}

export async function rejectSeller(sellerId) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`http://localhost:8000/api/sellers/${sellerId}/reject/`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Từ chối cửa hàng thất bại");
  return await res.json();
}
