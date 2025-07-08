import { useNavigate } from "react-router-dom";
import "./../styles/SellerDashboard.css";
import { useEffect } from "react";
import SellerChat from "../components/SellerChat"; // Assuming you have a SellerChat component

function SellerDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "seller") {
      alert("Bạn không có quyền truy cập trang này!");
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="seller-dashboard">
      <h2>Quản lý cửa hàng</h2>
      <div className="dashboard-actions">
        <button onClick={() => navigate("/manage-products")}>Quản lý sản phẩm</button>
        <button onClick={() => navigate("/orders")}>Xem đơn hàng</button>
        <button onClick={() => navigate("/")}>Về trang chủ</button>
        <button onClick={() => navigate("/seller-chat")}>Quản lý trò chuyện</button>
      </div>
    </div>
  );
}

export default SellerDashboard;

