import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/login_register/services/AuthContext";

const AdminPrivateRoute = () => {
  const { user, loading } = useAuth();

  // Hiển thị loading khi đang kiểm tra authentication
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!user || !user?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập nhưng không phải admin
  if (user?.role !== "admin") {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Truy cập bị từ chối</h4>
          <p>Bạn không có quyền truy cập vào trang quản trị.</p>
        </div>
      </div>
    );
  }

  // Nếu là admin, cho phép truy cập
  return <Outlet />;
};

export default AdminPrivateRoute;
