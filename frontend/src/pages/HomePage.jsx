import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import ChatBox from "../features/login_register/components/ChatBox";

function Homepage() {
  // const navigate = useNavigate();
  // const role = localStorage.getItem("role");
  // const username = localStorage.getItem("username");

  // // const handleLogout = () => {
  // //   localStorage.removeItem("token");
  // //   localStorage.removeItem("role");
  // //   localStorage.removeItem("username");
  // //   navigate("/login");
  // // };

  return (
    <div className="homepage-container">
      <h1>Chào mừng bạn đến trang chủ!</h1>

      <div className="role-links">
        {/* {role === "admin" && <Link to="/admin-dashboard">Quản trị</Link>}
        {role === "seller" && <Link to="/seller-dashboard">Quản lý cửa hàng</Link>}
        {role === "user" && <Link to="/profile">Trang cá nhân</Link>} */}
      </div>

      {/* <button onClick={handleLogout} className="logout-btn">
        Đăng xuất
      </button> */}

      {/* {(role === "user" || role === "seller" || role === "admin") && <ChatBox username={username || "Khách"} />}
      <ChatBox username={username} roomName={username} /> */}
    </div>
    
  );
}

export default Homepage;
