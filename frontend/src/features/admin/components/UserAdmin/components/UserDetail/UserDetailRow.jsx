// components/UserAdmin/UserDetailRow/UserDetailRow.jsx
// Component wrapper chính - Quản lý các tabs chính
import React, { useState, useCallback, useEffect } from "react";
import { Drawer, Tabs, Button, Space, Skeleton, message, Tooltip, Popconfirm } from "antd";
import { X, Edit, Lock, Unlock } from "lucide-react";
import UserEditForm from "../../UserEditForm";
import { useUserData } from "../../hooks/useUserData";
import { API_BASE_URL, getHeaders } from "../../api/config";
import axios from "axios";

// Import các tab components chính
import BasicInfoTab from "./tabs/BasicInfoTab";
import OrdersTab from "./tabs/OrdersTab";
import ActivityTab from "./tabs/ActivityTab";

export default function UserDetailRow({ visible, onClose, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Custom hook - Quản lý data fetching cho các tab chính
  const {
    orders,
    loadingOrders,
    fetchOrdersData,
    activities,
    loadingActivities,
    fetchActivitiesData,
  } = useUserData(user?.id, visible);

  // Fetch user detail khi drawer mở
  useEffect(() => {
    let mounted = true;

    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    };

    const fetchUserDetail = async () => {
      if (!user?.id) return;
      setDetailLoading(true);
      try {
        const urls = [
          `${API_BASE_URL}/users/management/${user.id}/`,
          `${API_BASE_URL}/users/management/${user.id}`,
          `${API_BASE_URL}/users/${user.id}/`,
          `${API_BASE_URL}/users/${user.id}`,
        ];

        let lastError = null;
        let response = null;
        for (const url of urls) {
          try {
            response = await axios.get(url, { headers: getHeaders() });
            if (response && response.status >= 200 && response.status < 300)
              break;
          } catch (err) {
            lastError = err;
            response = null;
            if (err?.response?.status === 404) continue;
            if (err?.response?.status === 401 || err?.response?.status === 403) {
              console.warn(`Auth error when fetching ${url}:`, err?.response?.status);
            }
          }
        }

        if (!response) {
          if (lastError && lastError.response) {
            const status = lastError.response.status;
            if (status === 404) {
              message.warning("Chi tiết user không tìm thấy trên server (404). Hiển thị dữ liệu tạm thời.");
            } else if (status === 401 || status === 403) {
              message.error("Không được phép truy cập chi tiết user (401/403). Kiểm tra token/permissions.");
            } else {
              message.error(`Lỗi khi tải chi tiết người dùng: ${status}`);
            }
          } else {
            message.error("Không thể kết nối đến endpoint chi tiết người dùng.");
          }
          if (mounted) setUserDetail(user || null);
          return;
        }

        if (mounted) setUserDetail(response.data);
      } catch (error) {
        console.error("Lỗi tải chi tiết người dùng:", error);
        message.error("Không thể tải chi tiết người dùng. Hiển thị dữ liệu tạm thời.");
        if (mounted) setUserDetail(user || null);
      } finally {
        if (mounted) setDetailLoading(false);
      }
    };

    if (visible && user?.id) {
      fetchUserDetail();
    } else if (!visible) {
      // clear detail when drawer closed
      setUserDetail(null);
    }

    return () => {
      mounted = false;
    };
  }, [visible, user]);

  // Memoize fetch functions
  const memoFetchOrders = useCallback(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);
  const memoFetchActivities = useCallback(() => {
    fetchActivitiesData();
  }, [fetchActivitiesData]);

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSave = (updatedUser) => {
    setIsEditing(false);
    setUserDetail(updatedUser);
    // Có thể refresh dữ liệu ở đây nếu cần
  };

  const handleToggleStatus = async () => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/toggle-active/${user.id}/`,
        {},
        { headers: getHeaders() }
      );
      setUserDetail({
        ...userDetail,
        is_active: response.data.is_active,
      });
      message.success(
        response.data.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"
      );
    } catch (error) {
      console.error(error);
      message.error("Không thể thay đổi trạng thái người dùng");
    }
  };

  if (isEditing) {
    return (
      <Drawer
        title={`Sửa ${userDetail?.full_name || userDetail?.username}`}
        placement="right"
        onClose={handleEditCancel}
        open={visible && isEditing}
        width={Math.min(800, window.innerWidth)}
        bodyStyle={{ padding: 0 }}
      >
        <UserEditForm
          editUser={userDetail || user}
          onCancel={handleEditCancel}
          onSave={handleEditSave}
        />
      </Drawer>
    );
  }

  const displayUser = userDetail || user;

  const tabItems = [
    {
      key: "1",
      label: "Thông tin cơ bản",
      children: detailLoading ? (
        <Skeleton active style={{ padding: "20px" }} />
      ) : (
        <BasicInfoTab user={displayUser} loading={false} />
      ),
    },
    {
      key: "2",
      label: "Đơn hàng",
      children: (
        <OrdersTab
          userId={user?.id}
          onLoad={memoFetchOrders}
          loading={loadingOrders}
          data={orders}
        />
      ),
    },
    {
      key: "3",
      label: "Hoạt động",
      children: (
        <ActivityTab
          userId={user?.id}
          onLoad={memoFetchActivities}
          loading={loadingActivities}
          data={activities}
        />
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* 2. TÊN USER ĐỂ RA SAU */}
          <span>{`Chi tiết - ${displayUser?.full_name || displayUser?.username}`}</span>
          {/* 1. ĐƯA LOGIC HIỂN THỊ MÀU LÊN TRƯỚC */}
          {displayUser?.is_active ? (
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#52c41a",
                // Đã xóa marginLeft: "auto" để nó nằm sát tên bên trái
              }}
              title="Đang hoạt động"
            />
          ) : (
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#f5222d",
                // Đã xóa marginLeft: "auto"
              }}
              title="Bị khóa"
            />
          )}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={Math.min(800, window.innerWidth)}
      bodyStyle={{ padding: 0 }}
      extra={
        <Space size="small">
          {/* Nút KHÓA/MỞ KHÓA */}
          {displayUser?.is_active ? (
            // TRƯỜNG HỢP ĐANG HOẠT ĐỘNG -> HIỂN THỊ NÚT KHÓA (MÀU ĐỎ)
            <Popconfirm
              title="Khóa tài khoản này?"
              description="Người dùng sẽ không thể đăng nhập sau khi khóa."
              onConfirm={handleToggleStatus}
              okText="Khóa ngay"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger // Antd danger type tự động làm nút màu đỏ
                type="primary" // Kết hợp primary danger để nổi bật
                size="small"
                loading={detailLoading}
                icon={<Lock size={16} />}
              >
                Khóa tài khoản
              </Button>
            </Popconfirm>
          ) : (
            // TRƯỜNG HỢP ĐÃ KHÓA -> HIỂN THỊ NÚT MỞ KHÓA (MÀU XANH)
            <Button
              type="primary"
              size="small"
              loading={detailLoading}
              icon={<Unlock size={16} />}
              onClick={handleToggleStatus}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} // Màu xanh success
            >
              Mở khóa
            </Button>
          )}

          {/* Nút SỬA - Dùng Ghost hoặc Default để bớt tranh chấp với nút hành động chính */}
          <Tooltip title="Chỉnh sửa thông tin">
            <Button
              size="small"
              icon={<Edit size={16} />}
              onClick={() => setIsEditing(true)}
              style={{ borderColor: "#1890ff", color: "#1890ff" }} // Style kiểu outline
            >
              Sửa
            </Button>
          </Tooltip>

        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabPosition="top"
        size="large"
        style={{ height: "100%", padding: "0 16px" }}
      />
    </Drawer>
  );
}
