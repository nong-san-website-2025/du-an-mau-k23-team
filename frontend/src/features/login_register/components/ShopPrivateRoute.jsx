import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../services/AuthContext";

export default function ShopPrivateRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!user.is_seller) return <Navigate to="/" />; 
  return <Outlet />;
}