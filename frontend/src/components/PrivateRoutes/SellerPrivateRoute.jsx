// src/components/PrivateRoutes/SellerPrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/login_register/services/AuthContext";

const SellerPrivateRoute = () => {
  const { user, loading } = useAuth();

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

  if (!user || !user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Chuẩn hóa role - hỗ trợ cả format object {name: "seller"} và string "seller"
  const roleValue = user?.role?.name || user?.role || "";
  const normalizedRole = String(roleValue).trim().toLowerCase();
  const isSellerFlag = localStorage.getItem("is_seller") === "true";

  if (!(normalizedRole === "seller" || isSellerFlag)) {
    return <Navigate to="/" replace />; // hoặc trang nào khác
  }

  // Nếu là seller → cho phép truy cập nested routes
  return <Outlet />;
};

export default SellerPrivateRoute;
