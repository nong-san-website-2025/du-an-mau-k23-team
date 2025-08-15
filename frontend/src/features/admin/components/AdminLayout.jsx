import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Bell, User, Settings, Globe, LogOut } from "lucide-react";
import AdminHeader from "./AdminHeader";
import { useAuth } from "../../login_register/services/AuthContext";



const adminMenu = [
  { to: "/admin/", label: "Tổng quan" },
  { to: "/admin/products", label: "Hàng hóa" },
  { to: "/admin/orders", label: "Đơn hàng" },
  { to: "/admin/users", label: "Khách hàng" },
  { to: "/admin/staff", label: "Nhân viên" },
  { to: "/admin/wallet", label: "Sổ quỹ" },
  { to: "/admin/reports", label: "Báo cáo" },
  { to: "/admin/online", label: "Bán online" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      logout();
      navigate("/login");
    }
  };

  return (
      <div className="bg-light" style={{ minHeight: "100vh" }}>
      {/* Top utility bar */}
      <div
        className="w-100"
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          minHeight: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          zIndex: 1,
        }}
      >
        <div className="d-flex align-items-center">
          <img
            src="/assets/logo/imagelogo.png"
            alt="Logo"
            style={{ height: 32, marginRight: 10, borderRadius: 8 }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 20,
              color: "#022856",
              letterSpacing: 0.5,
            }}
          >
            GreenFarm
          </span>
        </div>
        <div className="d-flex align-items-center" style={{ gap: 18 }}>
          <button
            className="btn btn-link p-0"
            style={{ color: "#22C55E" }}
            title="Thông báo"
          >
            <Bell size={22} />
          </button>

          <button
            className="btn btn-link p-0"
            style={{ color: "#22C55E" }}
            title="Ngôn ngữ"
          >
            <Globe size={22} />
          </button>
          <button
            className="btn btn-link p-0"
            style={{ color: "#22C55E" }}
            title="Cài đặt"
          >
            <Settings size={22} />
          </button>
          <button
            className="btn btn-link p-0"
            style={{ color: "#22C55E" }}
            title="Tài khoản"
          >
            <User size={22} />
          </button>
        </div>
      </div>
      {/* Top horizontal admin nav bar */}
      <nav
        className="navbar navbar-expand-lg"
        style={{
          background: "#22C55E",
          minHeight: 50,
          boxShadow: "0 2px 8px #0001",
          zIndex: 1040,
        }}
      >
        <div className="container-fluid px-3">
          <ul className="navbar-nav flex-row ms-3" style={{ gap: 8 }}>
            {adminMenu.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/admin/"}
                  className={({ isActive }) =>
                    "nav-link px-3 py-2 " + (isActive ? " active" : "")
                  }
                  style={({ isActive }) => ({
                    color: isActive ? "#fff" : "#fff",
                    background: isActive ? "	rgba(0, 0, 0, 0.2)" : "transparent",
                    borderRadius: 6,
                    fontSize: 14,
                    transition: "all 0.2s",
                    fontWeight: 600,

                  })}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="ms-auto d-flex align-items-center">
            {/* Place for user actions, theme, etc. */}
          </div>
        </div>
      </nav>
      {/* <AdminHeader /> */}
      <div className="container-fluid py-0">
        <div className="row" style={{ minHeight: "calc(100vh - 56px - 56px)" }}>
            <Outlet />
        </div>
      </div>
      </div>
  );
}
