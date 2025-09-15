import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../services/AuthContext";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth(); // Hàm login trực tiếp bằng token
  const [status, setStatus] = useState("Đang xác thực...");

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");
    const username = searchParams.get("username") || "unknown"; // Nếu backend gửi username

    if (access) {
      // Lưu token vào localStorage + cập nhật AuthContext
      loginWithToken(access, refresh, username);

      setStatus("Xác thực thành công! Đang chuyển hướng...");
      // Hard redirect để đảm bảo toàn bộ app re-init theo trạng thái mới
      setTimeout(() => (window.location.href = "/"), 200);
    } else {
      setStatus("Xác thực thất bại");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    }
  }, [searchParams, loginWithToken, navigate]);

  return <div>{status}</div>;
}
