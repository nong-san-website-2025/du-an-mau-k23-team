import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, UserCircle, ShoppingBag, Clock, LogOut, Store } from "lucide-react"; // Thêm icons cho sinh động (tuỳ chọn)
import { Avatar, Button, Dropdown, Menu } from "antd";
import "../styles/UserActions.css";

const UserProfileDropdown = ({
  isUserLoggedIn,
  userProfile,
  handleLogout,
  sellerStatus,
  setHoveredDropdown
}) => {
  const navigate = useNavigate();

  // Nếu chưa đăng nhập, hiển thị icon User đơn giản
  if (!isUserLoggedIn) {
    return (
      <Link to="/login" className="action-btn" style={{ textDecoration: 'none' }}>
        <User size={22} className="icon-default" />
      </Link>
    );
  }

  // Cấu trúc Menu
  const menu = (
    <Menu className="user-menu-wrapper">
      {/* 1. Header: Chỉ còn Avatar và Tên */}
      <div className="user-menu-header">
        <Avatar
          src={userProfile?.avatar}
          size={54}
          className="user-menu-avatar"
        >
          {!userProfile?.avatar && (localStorage.getItem("username")?.[0]?.toUpperCase() || "U")}
        </Avatar>
        <div className="user-menu-name">
          {userProfile?.full_name || "Khách hàng"}
        </div>
      </div>

      {/* 2. List Items: Các mục chức năng */}
      
      {/* Hồ sơ cá nhân - Đã chuyển xuống đây */}
      <Menu.Item key="profile" icon={<UserCircle size={16} />}>
        <Link to="/profile" className="user-menu-link">
          Hồ sơ cá nhân
        </Link>
      </Menu.Item>

      <Menu.Item key="orders" icon={<ShoppingBag size={16} />}>
        <Link to="/orders" className="user-menu-link">
          Đơn hàng của tôi
        </Link>
      </Menu.Item>

      <Menu.Item key="preorders" icon={<Clock size={16} />}>
        <Link to="/preorders" className="user-menu-link">
          Đơn đặt trước
        </Link>
      </Menu.Item>

      <Menu.Divider />

      {/* Logic hiển thị nút Cửa hàng */}
      <Menu.Item
        key="seller"
        icon={<Store size={16} style={{ color: (sellerStatus === "approved" || sellerStatus === "active") ? '#fff' : 'inherit' }} />}
        className={(sellerStatus === "approved" || sellerStatus === "active") ? "seller-item-active" : ""}
        onMouseEnter={() => setHoveredDropdown && setHoveredDropdown("register")}
        onMouseLeave={() => setHoveredDropdown && setHoveredDropdown(null)}
      >
         <Link 
            to={(sellerStatus === "approved" || sellerStatus === "active") ? "/seller-center" : "/register-seller"} 
            className="user-menu-link"
         >
            {(sellerStatus === "approved" || sellerStatus === "active") 
              ? "Cửa hàng của tôi" 
              : sellerStatus === "pending" 
                ? "Đang chờ duyệt" 
                : "Đăng ký bán hàng"}
         </Link>
      </Menu.Item>

      <Menu.Divider />

      {/* Đăng xuất */}
      <Menu.Item
        key="logout"
        icon={<LogOut size={16} />}
        className="logout-item"
        onClick={handleLogout}
      >
        <span className="user-menu-link">Đăng xuất</span>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="action-item" style={{ marginLeft: 8 }}>
      <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight" arrow>
        <Button type="text" shape="circle" style={{ padding: 0, border: 'none', height: 'auto' }}>
            <Avatar 
                src={userProfile?.avatar} 
                size={34} 
                style={{ 
                    border: "2px solid #f0f0f0", 
                    backgroundColor: '#e6f4ea',
                    color: '#16a34a',
                    cursor: 'pointer'
                }}
            >
                {!userProfile?.avatar && (localStorage.getItem("username")?.[0]?.toUpperCase() || "")}
            </Avatar>
        </Button>
      </Dropdown>
    </div>
  );
};

export default UserProfileDropdown;