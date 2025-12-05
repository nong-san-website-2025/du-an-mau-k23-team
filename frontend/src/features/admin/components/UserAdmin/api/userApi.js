// User Management API - Tập trung tất cả user-related API calls
import axios from "axios";
import { API_BASE_URL, getHeaders } from "./config";

// ============ Roles API ============
export const fetchRoles = async () => {
  // Try multiple possible endpoints to be tolerant to routing differences
  const candidates = [
    `${API_BASE_URL}/users/roles/list/`,
    `${API_BASE_URL}/users/roles/`,
    `${API_BASE_URL}/roles/list/`,
    `${API_BASE_URL}/roles/`,
  ];
  for (const url of candidates) {
    try {
      const response = await axios.get(url, { headers: getHeaders() });
      return response.data;
    } catch (err) {
      // Try next
    }
  }
  const err = new Error("Roles endpoint not found (tried multiple paths)");
  console.error("❌ Lỗi tải danh sách vai trò:", err);
  throw err;
};

export const createRole = async (roleName) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/roles/`,
      { name: roleName },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi tạo vai trò:", error);
    throw error;
  }
};

// ============ Users List API ============
export const fetchUsers = async () => {
  const candidates = [
    `${API_BASE_URL}/users/list/`,
    `${API_BASE_URL}/users/`,
    `${API_BASE_URL}/users/users/`,
  ];
  for (const url of candidates) {
    try {
      const response = await axios.get(url, { headers: getHeaders() });
      return Array.isArray(response.data) ? response.data : response.data.results || response.data.data || response.data;
    } catch (err) {
      // try next
    }
  }
  const err = new Error("Users endpoint not found (tried multiple paths)");
  console.error("❌ Lỗi tải danh sách người dùng:", err);
  throw err;
};

export const fetchUserDetail = async (userId) => {
  const candidates = [
    `${API_BASE_URL}/users/${userId}/`,
    `${API_BASE_URL}/users/users/${userId}/`,
    `${API_BASE_URL}/users/detail/${userId}/`,
  ];
  for (const url of candidates) {
    try {
      const response = await axios.get(url, { headers: getHeaders() });
      return response.data;
    } catch (err) {
      // try next
    }
  }
  const err = new Error(`User detail endpoint not found for id=${userId}`);
  console.error(`❌ Lỗi tải chi tiết người dùng ${userId}:`, err);
  throw err;
};

// ============ User CRUD ============
export const createUser = async (userData) => {
  const candidates = [
    `${API_BASE_URL}/users/user-management/`,
    `${API_BASE_URL}/users/`,
    `${API_BASE_URL}/users/users/`,
  ];
  for (const url of candidates) {
    try {
      const response = await axios.post(url, userData, { headers: getHeaders() });
      return response.data;
    } catch (err) {
      // continue
    }
  }
  const err = new Error("Create user endpoint not found");
  console.error("❌ Lỗi tạo người dùng:", err);
  throw err;
};

export const updateUser = async (userId, userData) => {
  // Chỉ gọi đúng endpoint quản lý user
  const url = `${API_BASE_URL}/users/management/${userId}/`;
  try {
    const response = await axios.put(url, userData, { headers: getHeaders() });
    return response.data;
  } catch (err) {
    const error = new Error(`Update user endpoint not found for id=${userId}`);
    console.error(`❌ Lỗi cập nhật người dùng ${userId}:`, error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  const candidates = [
    `${API_BASE_URL}/users/${userId}/`,
    `${API_BASE_URL}/users/users/${userId}/`,
    `${API_BASE_URL}/users/delete/${userId}/`,
  ];
  for (const url of candidates) {
    try {
      await axios.delete(url, { headers: getHeaders() });
      return true;
    } catch (err) {
      // try next
    }
  }
  const err = new Error(`Delete user endpoint not found for id=${userId}`);
  console.error(`❌ Lỗi xóa người dùng ${userId}:`, err);
  throw err;
};

// ============ User Status API ============
export const toggleUserStatus = async (userId, isActive) => {
  const candidates = [
    `${API_BASE_URL}/users/toggle-active/${userId}/`,
    `${API_BASE_URL}/users/${userId}/`,
    `${API_BASE_URL}/users/users/${userId}/`,
  ];
  for (const url of candidates) {
    try {
      const response = await axios.patch(url, { is_active: isActive }, { headers: getHeaders() });
      return response.data;
    } catch (err) {
      // try next
    }
  }
  const err = new Error(`Toggle user endpoint not found for id=${userId}`);
  console.error(`❌ Lỗi thay đổi trạng thái người dùng ${userId}:`, err);
  throw err;
};

// ============ User Behavior & Analytics API ============
export const fetchUserBehavior = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/behavior/`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi tải hành vi người dùng ${userId}:`, error);
    throw error;
  }
};

export const fetchUserViolations = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/violations/users/${userId}/`,
      { headers: getHeaders() }
    );
    // Handle response format
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.results) {
      return response.data.results;
    } else if (response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`❌ Lỗi tải vi phạm của người dùng ${userId}:`, error);
    return [];
  }
};

export const fetchUserOrders = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/orders/users/${userId}/`,
      { headers: getHeaders() }
    );
    // Handle response format - API might return array or object with results/data
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.results) {
      return response.data.results;
    } else if (response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`❌ Lỗi tải đơn hàng của người dùng ${userId}:`, error);
    return [];
  }
};

export const fetchUserActivityLog = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/activity-logs/users/${userId}/`,
      { headers: getHeaders() }
    );
    // Handle response format
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.results) {
      return response.data.results;
    } else if (response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`❌ Lỗi tải nhật ký hoạt động của người dùng ${userId}:`, error);
    return [];
  }
};

export const fetchUserPayments = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/payments/users/${userId}/`,
      { headers: getHeaders() }
    );
    // Handle response format
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.results) {
      return response.data.results;
    } else if (response.data.data) {
      return response.data.data;
    }
    return {};
  } catch (error) {
    console.error(`❌ Lỗi tải thông tin thanh toán của người dùng ${userId}:`, error);
    return {};
  }
};

export const fetchUserTechnicalInfo = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/technical-info/`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi tải thông tin kỹ thuật của người dùng ${userId}:`, error);
    throw error;
  }
};
