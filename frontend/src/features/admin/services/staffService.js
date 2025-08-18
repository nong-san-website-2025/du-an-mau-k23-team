import axiosInstance from "../../admin/services/axiosInstance";

// Lấy danh sách nhân viên
export const getEmployees = () => axiosInstance.get("/users/employees/");

// Thêm nhân viên mới
export const createEmployee = (data) => axiosInstance.post("/users/employees/", data);

// Sửa thông tin nhân viên
export const updateEmployee = (id, data) => axiosInstance.put(`/users/employees/${id}/`, data);

// Xóa nhân viên
export const deleteEmployee = (id) => axiosInstance.delete(`/users/employees/${id}/`);
