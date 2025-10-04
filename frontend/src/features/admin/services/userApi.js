// services/userApi.js

// Hàm gọi API chung có xử lý refresh token
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("access_token");
  let refresh = localStorage.getItem("refresh_token");

  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, options);

  // Nếu token hết hạn => thử refresh
  if (res.status === 401 && refresh) {
    const refreshRes = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("access_token", data.access);

      // Gắn lại token mới
      options.headers.Authorization = `Bearer ${data.access}`;
      res = await fetch(url, options);
    } else {
      // Refresh thất bại => logout
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("first_name");
  window.location.href = "/login";
      throw new Error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
    }
  }

  // Nếu API có trả dữ liệu JSON thì parse
  if (res.headers.get("content-type")?.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Lỗi API");
    return data;
  }

  // Nếu không có JSON (ví dụ DELETE) thì chỉ trả true/false
  if (!res.ok) throw new Error("Lỗi API");
  return true;
}

// API user
export const userApi = {
  // Lấy danh sách user
  getUsers: async () => {
    return await fetchWithAuth("http://localhost:8000/api/users/");
  },

  // Xóa user
  deleteUser: async (id) => {
    return await fetchWithAuth(`http://localhost:8000/api/users/${id}/`, {
      method: "DELETE",
    });
  },

  // Cập nhật user
  updateUser: async (id, data) => {
    return await fetchWithAuth(`http://localhost:8000/api/users/${id}/`, {
      method: "PATCH", // dùng PATCH thay vì PUT
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  // Thêm user
  addUser: async (data) => {
    return await fetchWithAuth("http://localhost:8000/api/users/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
};
