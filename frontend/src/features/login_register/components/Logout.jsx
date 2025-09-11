import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";

function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(); // dùng logout tập trung, không clear toàn bộ localStorage
    alert("Đăng xuất thành công!");
    navigate("/login");
  };

  return (
    <button onClick={handleLogout} className="logout-btn">
      Đăng xuất
    </button>
  );
}

export default Logout;