import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Bell, User, Settings, Globe } from "lucide-react";
import { useAuth } from "../../login_register/services/AuthContext";
import "../styles/AdminLayout.css";

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  const adminMenu = [
    { to: "/admin/", label: "Tổng quan" },
    { to: "/admin/products", label: "Hàng hóa" },
    { to: "/admin/orders", label: "Đơn hàng" },
    { to: "/admin/users", label: "Khách hàng" },
    { to: "/admin/shops", label: "Cửa hàng" },
    { to: "/admin/staff", label: "Nhân viên" },
    { to: "/admin/banners", label: "Giao diện" },
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
      window.location.href = "/login";
    }
  };

  // Track open/close state for dropdown items
  const [openMap, setOpenMap] = useState({});

  useEffect(() => {
    // Auto-open the dropdown if a child is active based on current URL
    const next = {};
    adminMenu.forEach((item) => {
      if (item.dropdown) {
        const isActiveChild = item.dropdown.some((c) =>
          location.pathname.startsWith(c.to)
        );
        next[item.to] = isActiveChild;
      }
    });
    setOpenMap((prev) => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleOpen = (key) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="admin-shell bg-light">
      {/* Top utility bar */}
      <TopBar onLogout={handleLogout} />

      {/* Main area with left sidebar */}
      <div className="admin-main">
        <aside className="admin-sidebar">
          <ul className="admin-sidemenu">
            {adminMenu.map((item) => (
              <li className="admin-sidemenu-item" key={item.to}>
                {item.dropdown ? (
                  <>
                    <button
                      type="button"
                      className={
                        "admin-sidemenu-link admin-sidemenu-toggle" +
                        (openMap[item.to] ? " active" : "")
                      }
                      onClick={() => toggleOpen(item.to)}
                      aria-expanded={openMap[item.to] ? "true" : "false"}
                    >
                      <span>{item.label}</span>
                      <span className={"admin-caret" + (openMap[item.to] ? " rotated" : "")}>
                        ▾
                      </span>
                    </button>

                    {openMap[item.to] && (
                      <div className="admin-sidemenu-sub open">
                        {item.dropdown.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className={({ isActive }) =>
                              "admin-sidemenu-sublink" + (isActive ? " active" : "")
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.to}
                    end={item.to === "/admin/"}
                    className={({ isActive }) =>
                      "admin-sidemenu-link" + (isActive ? " active" : "")
                    }
                  >
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </aside>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ----------------- Components ----------------- */

function TopBar() {
  return (
    <div className="admin-topbar">
      <div className="d-flex align-items-center">
        <img src="/assets/logo/imagelogo.png" alt="Logo" className="admin-logo" />
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