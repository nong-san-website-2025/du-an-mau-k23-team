// src/components/PrivateRoutes/SellerPrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/login_register/services/AuthContext";
import { message } from "antd"; // Nếu project có dùng antd thì import để hiện thông báo

const SellerPrivateRoute = () => {
  const { user, loading: authLoading } = useAuth();
  
  // Thêm state để quản lý việc kiểm tra trạng thái từ API
  const [isStoreActive, setIsStoreActive] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    // 1. Nếu Auth đang load hoặc chưa đăng nhập thì chưa check vội
    if (authLoading) return;
    if (!user || !user.isAuthenticated) {
      setStatusLoading(false);
      return;
    }

    // 2. Hàm gọi API kiểm tra trạng thái mới nhất
    const verifySellerStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");

        const res = await fetch(`${process.env.REACT_APP_API_URL}/sellers/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Chưa đăng ký seller hoặc lỗi
          setIsStoreActive(false);
        } else {
          const data = await res.json();
          // === CHỐT CHẶN QUAN TRỌNG ===
          // Chỉ cho qua nếu status là 'active'
          if (data.status === "active") {
            setIsStoreActive(true);
          } else {
            // Nếu là pending/approved -> Chặn
            setIsStoreActive(false);
          }
        }
      } catch (error) {
        console.error("Lỗi check seller status:", error);
        setIsStoreActive(false);
      } finally {
        setStatusLoading(false);
      }
    };

    verifySellerStatus();
  }, [user, authLoading]);

  // --- RENDER ---

  // 1. Đang tải (Auth hoặc đang check Status API)
  if (authLoading || statusLoading) {
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

  // 2. Chưa đăng nhập -> Về Login
  if (!user || !user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Đã đăng nhập nhưng Cửa hàng CHƯA ACTIVE -> Về trang trạng thái/đăng ký
  if (!isStoreActive) {
    // Có thể thêm thông báo nếu muốn
    // message.warning("Cửa hàng chưa được kích hoạt!");
    return <Navigate to="/seller/register" replace />;
  }

  // 4. Mọi thứ OK -> Cho vào Dashboard
  return <Outlet />;
};

export default SellerPrivateRoute;