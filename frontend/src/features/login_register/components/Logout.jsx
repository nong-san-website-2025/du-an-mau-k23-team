import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Hoặc sessionStorage nếu bạn lưu ở đó
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