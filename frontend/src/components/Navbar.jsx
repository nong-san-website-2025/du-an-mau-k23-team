import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => (
  <nav>
    <Link to="/">Trang chủ</Link> | <Link to="/me">Tài khoản</Link> | <Link to="/login">Đăng nhập</Link>
  </nav>
);

export default Navbar;