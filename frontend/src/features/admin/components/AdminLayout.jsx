import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Bell, User, Settings, Globe } from "lucide-react";
import { useAuth } from "../../login_register/services/AuthContext";
import "../styles/AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const adminMenu = [
    { to: "/admin/", label: "Tổng quan" },
    { to: "/admin/products", label: "Hàng hóa" },
    { to: "/admin/orders", label: "Đơn hàng" },
    { to: "/admin/users", label: "Khách hàng" },
    { to: "/admin/shops", label: "Cửa hàng" },
    { to: "/admin/staff", label: "Nhân viên" },
    { to: "/admin/wallet", label: "Sổ quỹ" },
    { to: "/admin/reports", label: "Báo cáo" },
    {
      to: "/admin/supports",
      label: "Yêu cầu hỗ trợ",
      dropdown: [
        { label: "Duyệt cửa hàng", to: "/admin/sellers/pending" },
        { label: "Duyệt tiền", to: "/admin/supports" },
      ],
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="bg-light min-vh-100">
      {/* Top utility bar */}
      <TopBar />

      {/* Horizontal admin nav bar */}
      <NavBar adminMenu={adminMenu} navigate={navigate} />

      {/* Main content */}
      <div className="container-fluid py-0">
        <div className="row" style={{ minHeight: "calc(100vh - 96px)" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

/* ----------------- Components ----------------- */

function TopBar() {
  return (
    <div className="admin-topbar">
      <div className="d-flex align-items-center">
        <img
          src="/assets/logo/imagelogo.png"
          alt="Logo"
          className="admin-logo"
        />
        <span className="admin-brand">GreenFarm</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <TopBarButton Icon={Bell} title="Thông báo" />
        <TopBarButton Icon={Globe} title="Ngôn ngữ" />
        <TopBarButton Icon={Settings} title="Cài đặt" />
        <TopBarButton Icon={User} title="Tài khoản" />
      </div>
    </div>
  );
}

function TopBarButton({ Icon, title }) {
  return (
    <button className="btn btn-link p-0 admin-topbar-btn" title={title}>
      <Icon size={22} />
    </button>
  );
}

function NavBar({ adminMenu, navigate }) {
  return (
    <nav className="navbar navbar-expand-lg admin-navbar">
      <div className="container-fluid px-2">
        <ul className="navbar-nav flex-row ms-3">
          {adminMenu.map((item) =>
            item.dropdown ? (
              <li
                className="nav-item position-relative admin-dropdown"
                key={item.to}
              >
                {/* Sửa: dùng NavLink thay vì span */}
                <NavLink
                  to={item.to}
                  end={false}
                  className={({ isActive }) =>
                    "admin-nav-link px-3 py-2" + (isActive ? " active" : "")
                  }
                >
                  {item.label}
                </NavLink>

                {/* Dropdown con */}
                <div className="dropdown-menu-custom">
                  {item.dropdown.map((child) => (
                    <button
                      key={child.to}
                      className="dropdown-item-custom"
                      onClick={() => navigate(child.to)}
                      
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              </li>
            ) : (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/admin/"}
                  className={({ isActive }) =>
                    "admin-nav-link px-3 py-2" + (isActive ? " active" : "")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            )
          )}
        </ul>
      </div>
    </nav>
  );
}
