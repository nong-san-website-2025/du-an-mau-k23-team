// User Management API - Tập trung tất cả user-related API calls
import axios from "axios";
import { API_BASE_URL, getHeaders } from "./config";

// ============ Roles API ============
export const fetchRoles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/roles/list/`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi tải danh sách vai trò:", error);
    throw error;
  }
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
  try {
    const response = await axios.get(`${API_BASE_URL}/users/`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi tải danh sách người dùng:", error);
    throw error;
  }
};

export const fetchUserDetail = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi tải chi tiết người dùng ${userId}:`, error);
    throw error;
  }
};

// ============ User CRUD ============
export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/user-management/`, userData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi tạo người dùng:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/${userId}/`, userData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi cập nhật người dùng ${userId}:`, error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await axios.delete(`${API_BASE_URL}/users/${userId}/`, {
      headers: getHeaders(),
    });
    return true;
  } catch (error) {
    console.error(`❌ Lỗi xóa người dùng ${userId}:`, error);
    throw error;
  }
};

// ============ User Status API ============
export const toggleUserStatus = async (userId, isActive) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/users/${userId}/`,
      { is_active: isActive },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi thay đổi trạng thái người dùng ${userId}:`, error);
    throw error;
  }
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
