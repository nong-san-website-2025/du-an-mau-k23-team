import React, { useMemo, useState, useEffect } from "react";
import {
  Table, Modal, message, Tag, Avatar, Drawer, Spin, Space, Typography, Tooltip, Button
} from "antd";
import {
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  StarFilled,
  EnvironmentOutlined,
  ManOutlined,
  WomanOutlined,
  EyeOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import locale tiếng Việt cho dayjs
import relativeTime from "dayjs/plugin/relativeTime"; // Plugin hiển thị "vài giây trước"

// Import Component con
import UserAddModal from "./UserAddModal";
// import ButtonAction from "../../../../components/ButtonAction"; // Đã thay thế bằng actions trực tiếp để đẹp hơn
// import StatusTag from "../../../../components/StatusTag"; // Đã tích hợp vào UI mới

// Import Form Sửa
import UserEditForm from "../../components/UserAdmin/components/UserForms/UserEditForm";
import { fetchRoles } from "./api/userApi";

// Cấu hình dayjs
dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text } = Typography;
const { confirm } = Modal;

// --- HELPER FUNCTIONS ---
const formatCurrency = (value) => {
  if (!value) return "0 ₫";
  const numberVal = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(numberVal);
};

const getTierColor = (tierColor) => {
  const map = {
    gold: "gold",
    cyan: "cyan", // Thường dùng cho Platinum/Diamond tuỳ design system
    silver: "blue", // Antd không có preset silver, dùng blue hoặc custom hex
    default: "default",
  };
  return map[tierColor] || "default";
};

export default function UserTable({
  users = [],
  setUsers,
  loading = false,
  selectedRole = "all",
  statusFilter = "all",
  searchTerm = "",
  checkedIds = [],
  setCheckedIds,
  triggerAddUser,
  setTriggerAddUser,
  onRow,
}) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;

  // --- STATE QUẢN LÝ ---
  const [editingUser, setEditingUser] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Preload roles & Detect mobile
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setRolesLoading(true);
      try {
        const data = await fetchRoles();
        if (mounted) setRoles(data || []);
      } catch (err) {
        console.error("Lỗi preload roles:", err);
      } finally {
        if (mounted) setRolesLoading(false);
      }
    };
    load();

    const mql = window.matchMedia("(max-width: 768px)"); // Đổi thành 768px cho tablet/mobile
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches); // Set init value
    mql.addEventListener("change", handleChange);
    return () => {
      mql.removeEventListener("change", handleChange);
      mounted = false;
    };
  }, []);

  // --- LOGIC REALTIME SEARCH & FILTER ---
  const filteredUsers = useMemo(() => {
    const s = searchTerm.normalize("NFC").toLowerCase().trim();
    return (Array.isArray(users) ? users : []).filter((u) => {
      // Lọc theo vai trò
      if (selectedRole !== "all") {
        const roleName = u?.role?.name?.toLowerCase();
        if (roleName !== selectedRole) return false;
      }
      // Lọc theo trạng thái
      if (statusFilter !== "all") {
        const statusMatch =
          statusFilter === "active" ? u.is_active : !u.is_active;
        if (!statusMatch) return false;
      }
      // Tìm kiếm đa năng
      return (
        s === "" ||
        [u.username, u.full_name, u.email, u.phone].some((field) =>
          (field ?? "").toString().toLowerCase().includes(s)
        )
      );
    });
  }, [users, searchTerm, selectedRole, statusFilter]);

  const rowSelection = {
    selectedRowKeys: checkedIds,
    onChange: (keys) => setCheckedIds(keys),
    getCheckboxProps: (record) => ({
      disabled: record?.role?.name?.toLowerCase() === "admin",
    }),
  };

  // --- HANDLERS ---

  const handleEditClick = async (e, record) => {
    if (e) e.stopPropagation();
    setIsFetchingDetail(true);
    try {
      const response = await axios.get(
        `${API_URL}/users/management/${record.id}/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setEditingUser(response.data);
    } catch (error) {
      // Fallback nếu API lỗi, dùng data hiện có
      setEditingUser(record);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleEditSave = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
    setEditingUser(null);
    message.success("Cập nhật thành công");
  };

  const handleToggleUser = async (e, user) => {
    if (e) e.stopPropagation();
    try {
      const res = await axios.patch(
        `${API_URL}/users/toggle-active/${user.id}/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      // Optimistic Update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: res.data.is_active } : u
        )
      );
      message.success(res.data.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    } catch (err) {
      message.error("Lỗi thao tác toggle active");
    }
  };

  const handleDeleteUser = (e, user) => {
    if (e) e.stopPropagation();
    confirm({
      title: `Xóa người dùng "${user.username}"?`,
      content: "Hành động này không thể hoàn tác.",
      icon: <ExclamationCircleOutlined />,
      okText: "Xóa vĩnh viễn",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/users/management/${user.id}/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setCheckedIds((prev) => prev.filter((id) => id !== user.id));
          message.success("Xóa thành công");
        } catch (err) {
          message.error("Không thể xóa người dùng này");
        }
      },
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => {
    if (triggerAddUser) {
      setShowAddModal(true);
      setTriggerAddUser(false);
    }
  }, [triggerAddUser, setTriggerAddUser]);

  const handleUserAdded = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
    setShowAddModal(false);
  };

  // --- NEW COLUMNS DEFINITION ---
  const columns = [
    {
      title: "Thông tin khách hàng",
      key: "user_info",
      width: 320,
      fixed: isMobile ? undefined : "left",
      sorter: (a, b) => (a.full_name || "").localeCompare(b.full_name || ""),
      render: (_, record) => (
        <Space align="start" size={12}>
          {/* Avatar với Indicator trạng thái */}
          <div style={{ position: "relative" }}>
            <Avatar
              src={record.avatar}
              size={46}
              icon={<UserOutlined />}
              style={{
                backgroundColor: record.is_active ? "#1890ff" : "#f5f5f5",
                filter: record.is_active ? "none" : "grayscale(100%)"
              }}
            >
              {record.full_name?.[0]}
            </Avatar>
            {!record.is_active && (
              <LockOutlined style={{
                position: 'absolute', bottom: -4, right: -4,
                background: '#ff4d4f', color: '#fff',
                borderRadius: '50%', padding: 3, fontSize: 10
              }} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text strong style={{ fontSize: 15, color: record.is_active ? 'inherit' : '#999' }}>
                {record.full_name || "Chưa đặt tên"}
              </Text>
              {record.role?.name?.toLowerCase() === 'admin' && (
                <Tag color="red" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>ADMIN</Tag>
              )}
              {record.role?.name?.toLowerCase() === 'seller' && (
                <Tag color="orange" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>SELLER</Tag>
              )}
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>@{record.username}</Text>

            <Space size={8} style={{ marginTop: 2 }}>
              <Tooltip title="Email">
                <Space size={4} style={{ fontSize: 12, color: '#8c8c8c' }}>
                  <MailOutlined /> {record.email}
                </Space>
              </Tooltip>
              {record.phone && (
                <Tooltip title="Số điện thoại">
                  <Space size={4} style={{ fontSize: 12, color: '#8c8c8c' }}>
                    <PhoneOutlined /> {record.phone}
                  </Space>
                </Tooltip>
              )}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: "Hạng & Chi tiêu",
      key: "tier_info",
      width: 200,
      sorter: (a, b) => parseFloat(a.total_spent || 0) - parseFloat(b.total_spent || 0),
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Chỉ hiển thị Tag hạng thành viên */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tag color={getTierColor(record.tier_color)} style={{ margin: 0, fontWeight: 600, border: 'none' }}>
              {record.tier_name?.toUpperCase() || "MEMBER"}
            </Tag>
          </div>

          {/* Tổng chi tiêu */}
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>Tổng chi tiêu:</Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#389e0d' }}>
              {formatCurrency(record.total_spent)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Địa chỉ mặc định",
      key: "address",
      width: 260,
      render: (_, record) => {
        const defaultAddress = record.addresses?.find(a => a.is_default) || record.addresses?.[0];

        if (!defaultAddress) {
          return <Text type="secondary" italic style={{ fontSize: 12 }}>Chưa cập nhật địa chỉ</Text>;
        }

        return (
          <Tooltip title={defaultAddress.location}>
            <div style={{ display: 'flex', alignItems: 'start', gap: 6 }}>
              <EnvironmentOutlined style={{ color: '#ff4d4f', marginTop: 3 }} />
              <div style={{ fontSize: 13, lineHeight: '1.4' }}>
                <div style={{ fontWeight: 500, fontSize: 12 }}>
                  {defaultAddress.recipient_name} - {defaultAddress.phone}
                </div>
                <Text ellipsis style={{ maxWidth: 220, display: 'block', color: '#595959', fontSize: 12 }}>
                  {defaultAddress.location}
                </Text>
              </div>
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: "Ngày tham gia",
      key: "created_at",
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (_, record) => (
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 500 }}>{dayjs(record.created_at).format("DD/MM/YYYY")}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(record.created_at).fromNow()}
          </Text>
        </div>
      ),
    },
    {
      title: "Tác vụ",
      key: "actions",
      width: 140, // Tăng nhẹ width từ 130 -> 140 để đủ chỗ cho 4 nút
      fixed: isMobile ? undefined : "right",
      align: "center",
      render: (_, record) => (
        <Space size={2} onClick={(e) => e.stopPropagation()}>
          {/* --- NÚT XEM CHI TIẾT (MỚI) --- */}
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: '#595959' }} />} // Màu xám đậm trung tính
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                // Ưu tiên 1: Nếu cha có truyền hàm onRow (để qua trang detail riêng)
                if (onRow) {
                  onRow(record);
                } else {
                  // Ưu tiên 2: Mở Drawer hiện tại (như nút sửa) để xem nhanh
                  handleEditClick(e, record);
                }
              }}
            />
          </Tooltip>

          {/* Nút Sửa */}
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              size="small"
              onClick={(e) => handleEditClick(e, record)}
              loading={isFetchingDetail && editingUser?.id === record.id}
            />
          </Tooltip>

          {/* Nút Khóa/Mở khóa */}
          <Tooltip title={record.is_active ? "Khóa tài khoản" : "Mở khóa"}>
            <Button
              type="text"
              icon={record.is_active ? <UnlockOutlined style={{ color: '#52c41a' }} /> : <LockOutlined style={{ color: '#ff4d4f' }} />}
              size="small"
              onClick={(e) => handleToggleUser(e, record)}
            />
          </Tooltip>

          {/* Nút Xóa */}
          <Tooltip title={record.role?.name === 'admin' ? "Không thể xóa Admin" : "Xóa vĩnh viễn"}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.role?.name === 'admin'}
              onClick={(e) => handleDeleteUser(e, record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="user-table-container" style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            pageSize: 10,
            showTotal: (t) => `Tổng ${t} users`,
            showSizeChanger: true
          }}
          scroll={{ x: 1100 }}
          bordered={false} // Bỏ border dọc để nhìn thoáng hơn (Modern UI)
          onRow={(record) => ({
            onClick: () => onRow && onRow(record),
            style: { cursor: 'pointer' }
          })}
        />
      </div>

      <UserAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />

      <Drawer
        title={
          <Space>
            <EditOutlined />
            <span>Chỉnh sửa: {editingUser?.username}</span>
          </Space>
        }
        placement="right"
        width={isMobile ? "100%" : 600}
        onClose={() => setEditingUser(null)}
        open={!!editingUser}
        destroyOnClose
        styles={{ body: { paddingBottom: 80 } }} // Antd v5 property
      >
        {isFetchingDetail ? (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <Spin tip="Đang tải dữ liệu..." />
          </div>
        ) : (
          <UserEditForm
            editUser={editingUser}
            roles={roles}
            onCancel={() => setEditingUser(null)}
            onSave={handleEditSave}
          />
        )}
      </Drawer>
    </>
  );
}