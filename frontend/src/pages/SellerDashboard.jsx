import { useNavigate } from "react-router-dom";
import "./../styles/SellerDashboard.css";
import { useEffect } from "react";

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
      {/* Header */}
      <header className="dashboard-header">
        <h1>Quản lý cửa hàng</h1>
        <div className="header-actions">
          <button className="logout-btn" onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}>Đăng xuất</button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-card" onClick={() => navigate("/manage-products")}>
          <i className="fas fa-box-open"></i>
          <span>Quản lý sản phẩm</span>
        </div>
        <div className="dashboard-card" onClick={() => navigate("/orders")}>
          <i className="fas fa-shopping-cart"></i>
          <span>Xem đơn hàng</span>
        </div>
        <div className="dashboard-card" onClick={() => navigate("/")}>
          <i className="fas fa-home"></i>
          <span>Về trang chủ</span>
        </div>
        <div className="dashboard-card" onClick={() => navigate("/seller-chat")}>
          <i className="fas fa-comments"></i>
          <span>Quản lý trò chuyện</span>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
