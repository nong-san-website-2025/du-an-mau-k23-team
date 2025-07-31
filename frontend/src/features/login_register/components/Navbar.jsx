import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  // Ẩn navbar nếu đang ở trang seller-chat
  if (location.pathname === "/seller-chat") return null;

  return (
    <nav>
      <Link to="/">Trang chủ</Link> | <Link to="/me">Tài khoản</Link> | <Link to="/login">Đăng nhập</Link>
    </nav>
  );
};

export default Navbar;
