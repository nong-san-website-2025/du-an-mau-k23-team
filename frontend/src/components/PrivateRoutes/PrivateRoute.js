import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/login_register/services/AuthContext";

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  // Nếu còn loading, có thể render null hoặc spinner
  if (loading) return null; // hoặc <div>Loading...</div>

  // Nếu chưa login thì redirect
  if (!user?.isAuthenticated) return <Navigate to="/login" />;

  // Nếu đã login thì cho render Outlet (các route con)
  return <Outlet />;
};

export default PrivateRoute;
