import React from "react";
import { Link, useLocation } from "react-router-dom";

const menu = [
  { label: "Dashboard", path: "/admin" },
  { label: "Người dùng", path: "/admin/users" },
  { label: "Shop", path: "/admin/shops" },
  { label: "Sản phẩm", path: "/admin/products" },
  { label: "Đơn hàng", path: "/admin/orders" },
  { label: "Khiếu nại", path: "/admin/complaints" },
  { label: "Yêu cầu hỗ trợ", path: "/admin/supports" },
  { label: "Voucher", path: "/admin/vouchers" },
  { label: "Ví điện tử", path: "/admin/wallet" },
  { label: "Banner", path: "/admin/banners" },
  { label: "Thông báo", path: "/admin/notifications" },
  { label: "Nhân sự", path: "/admin/staff" },
  { label: "Báo cáo", path: "/admin/reports" },
];

export default function AdminSidebar() {
  const location = useLocation();
  const mainColor = "#22C55E";
  return (
    <div className="bg-light vh-100" style={{width:240, position:'fixed', left:0, top:0, bottom:0, zIndex:100, borderRight:`4px solid ${mainColor}`}}>
      <div className="p-0 border-bottom d-flex align-items-center gap-2" style={{color:mainColor}}>
        <img src="/assets/logo/imagelogo.png" alt="Logo" style={{height:72, width:72, objectFit:'contain', borderRadius:0 }} />
      </div>
      <ul className="nav flex-column mt-3">
        {menu.map(item => (
          <li className="nav-item" key={item.path}>
            <Link
              to={item.path}
              className={`nav-link px-3 py-2 ${location.pathname === item.path ? 'fw-bold' : 'text-dark'}`}
              style={{
                borderRadius:0,
                color: location.pathname === item.path ? '#fff' : '#222',
                background: location.pathname === item.path ? mainColor : 'none',
                fontWeight: location.pathname ===   item.path ? 700 : 500,
                boxShadow: location.pathname === item.path ? '0 2px 8px #22c55e22' : 'none',
                border: location.pathname === item.path ? `1px solid ${mainColor}` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
