import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  Modal,
  message,
  Tag,
  Avatar,
  Drawer,
  Spin,
  Space,
  Typography,
  Tooltip,
  Button,
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
  EnvironmentOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";

// --- IMPORT COMPONENTS ---
import UserAddModal from "./UserAddModal";
import UserEditForm from "../../components/UserAdmin/components/UserForms/UserEditForm";
import UserDetailRow from "./components/UserDetail/UserDetailRow"; // TODO: Đổi về "" // Giả sử đây là Modal hoặc Drawer chi tiết
import { fetchRoles } from "./api/userApi";

// --- CONFIG ---
dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text } = Typography;
const { confirm } = Modal;

// --- HELPER FUNCTIONS ---
const formatCurrency = (value) => {
  if (!value) return "0 ₫";
  const numberVal = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numberVal);
};

const getTierColor = (tierColor) => {
  const map = {
    gold: "gold",
    cyan: "cyan",
    silver: "blue",
    default: "default",
  };
  return map[tierColor] || "default";
};

const calculateTierFromSpent = (totalSpent) => {
  const amount = parseFloat(totalSpent || 0);
  if (amount >= 10000000)
    return { name: "KIM CƯƠNG", color: "#1890ff", tagColor: "cyan" }; // > 10tr
  if (amount >= 5000000)
    return { name: "VÀNG", color: "#faad14", tagColor: "gold" }; // > 5tr
  if (amount >= 2000000)
    return { name: "BẠC", color: "#78909c", tagColor: "blue" }; // > 2tr
  return { name: "THÀNH VIÊN", color: "#595959", tagColor: "default" }; // < 2tr
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
  onRow, // Hàm điều hướng sang trang chi tiết (nếu có)
}) {
  const { t } = useTranslation();
  const API_URL = process.env.REACT_APP_API_URL;

  // --- STATE QUẢN LÝ ---
  const [isMobile, setIsMobile] = useState(false);

  // State cho SỬA (Edit)
  const [editingUser, setEditingUser] = useState(null);

  // State cho XEM CHI TIẾT (Detail)
  const [detailUser, setDetailUser] = useState(null);

  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // State cho Modal thêm mới
  const [showAddModal, setShowAddModal] = useState(false);

  // --- INITIAL EFFECT ---
  useEffect(() => {
    let mounted = true;
    const loadRoles = async () => {
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
    loadRoles();

    const mql = window.matchMedia("(max-width: 768px)");
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => {
      mql.removeEventListener("change", handleChange);
      mounted = false;
    };
  }, []);

  // Effect mở modal thêm user từ props
  useEffect(() => {
    if (triggerAddUser) {
      setShowAddModal(true);
      setTriggerAddUser(false);
    }
  }, [triggerAddUser, setTriggerAddUser]);

  // --- LOGIC SEARCH & FILTER ---
  const filteredUsers = useMemo(() => {
    const s = searchTerm.normalize("NFC").toLowerCase().trim();
    return (Array.isArray(users) ? users : []).filter((u) => {
      // Filter Role
      if (selectedRole !== "all") {
        const roleName = u?.role?.name?.toLowerCase();
        if (roleName !== selectedRole) return false;
      }
      // Filter Status
      if (statusFilter !== "all") {
        const statusMatch =
          statusFilter === "active" ? u.is_active : !u.is_active;
        if (!statusMatch) return false;
      }
      // Search
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

  // --- CORE HANDLERS (LOGIC) ---

  // 1. Hàm cập nhật list users local (Dùng chung cho Add, Edit, Detail Update)
  const handleUpdateLocalList = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  // 2. Fetch data chi tiết (Dùng cho cả Edit và View nếu cần data đầy đủ)
  const fetchUserDetail = async (id, fallbackRecord) => {
    setIsFetchingDetail(true);
    try {
      const response = await axios.get(`${API_URL}/users/management/${id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return response.data;
    } catch (error) {
      console.error("Fetch detail failed, using fallback", error);
      return fallbackRecord;
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // 3. Xử lý click nút SỬA
  const handleEditClick = async (e, record) => {
    if (e) e.stopPropagation();
    // Set tạm record hiện tại để hiển thị ngay
    setEditingUser(record);
    // Fetch dữ liệu mới nhất
    const fullData = await fetchUserDetail(record.id, record);
    setEditingUser(fullData);
  };

  // 4. Xử lý lưu sau khi SỬA
  const handleEditSave = (updatedUser) => {
    handleUpdateLocalList(updatedUser);
    setEditingUser(null);
    message.success("Cập nhật thành công");
  };

  // 5. Xử lý click nút XEM CHI TIẾT
  const handleViewDetailClick = async (e, record) => {
    if (e) e.stopPropagation();

    // Ưu tiên 1: Nếu cha truyền onRow (điều hướng trang khác)
    if (onRow) {
      onRow(record);
      return;
    }

    // Ưu tiên 2: Mở Modal/Drawer chi tiết tại chỗ
    setDetailUser(record);
    const fullData = await fetchUserDetail(record.id, record);
    setDetailUser(fullData);
  };

  // 6. Xử lý Toggle Active
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
      // Cập nhật local
      handleUpdateLocalList({ ...user, is_active: res.data.is_active });
      message.success(
        res.data.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"
      );
    } catch (err) {
      message.error("Lỗi thao tác toggle active");
    }
  };

  // 7. Xử lý Xóa
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

  // 8. Xử lý Thêm mới thành công
  const handleUserAdded = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
    setShowAddModal(false);
  };

  // --- COLUMNS DEFINITION ---
  const columns = [
    {
      title: "Thông tin khách hàng",
      key: "user_info",
      width: 320,
      fixed: isMobile ? undefined : "left",
      sorter: (a, b) => (a.full_name || "").localeCompare(b.full_name || ""),
      render: (_, record) => (
        <Space align="start" size={12}>
          <div style={{ position: "relative" }}>
            <Avatar
              src={record.avatar}
              size={46}
              icon={<UserOutlined />}
              style={{
                backgroundColor: record.is_active ? "#1890ff" : "#f5f5f5",
                filter: record.is_active ? "none" : "grayscale(100%)",
              }}
            >
              {record.full_name?.[0]}
            </Avatar>
            {!record.is_active && (
              <LockOutlined
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  background: "#ff4d4f",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: 3,
                  fontSize: 10,
                }}
              />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Text
                strong
                style={{
                  fontSize: 15,
                  color: record.is_active ? "inherit" : "#999",
                }}
              >
                {record.full_name || "Chưa đặt tên"}
              </Text>
              {record.role?.name?.toLowerCase() === "admin" && (
                <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
                  ADMIN
                </Tag>
              )}
              {record.role?.name?.toLowerCase() === "seller" && (
                <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>
                  SELLER
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              @{record.username}
            </Text>
            <Space size={8} style={{ marginTop: 2 }}>
              <Tooltip title="Email">
                <Space size={4} style={{ fontSize: 12, color: "#8c8c8c" }}>
                  <MailOutlined /> {record.email}
                </Space>
              </Tooltip>
              {record.phone && (
                <Tooltip title="Số điện thoại">
                  <Space size={4} style={{ fontSize: 12, color: "#8c8c8c" }}>
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
      sorter: (a, b) =>
        parseFloat(a.total_spent || 0) - parseFloat(b.total_spent || 0),
      render: (_, record) => {
        // TỰ TÍNH HẠNG DỰA TRÊN TIỀN (Thay vì lấy record.tier_name)
        const tierInfo = calculateTierFromSpent(record.total_spent);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <Tag
                color={tierInfo.tagColor}
                style={{ margin: 0, fontWeight: 700, border: "none" }}
              >
                {tierInfo.name}
              </Tag>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Tổng chi tiêu:
              </Text>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#389e0d" }}>
                {formatCurrency(record.total_spent)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Địa chỉ mặc định",
      key: "address",
      width: 260,
      render: (_, record) => {
        const defaultAddress =
          record.addresses?.find((a) => a.is_default) || record.addresses?.[0];
        if (!defaultAddress) {
          return (
            <Text type="secondary" italic style={{ fontSize: 12 }}>
              Chưa cập nhật địa chỉ
            </Text>
          );
        }
        return (
          <Tooltip title={defaultAddress.location}>
            <div style={{ display: "flex", alignItems: "start", gap: 6 }}>
              <EnvironmentOutlined style={{ color: "#ff4d4f", marginTop: 3 }} />
              <div style={{ fontSize: 13, lineHeight: "1.4" }}>
                <div style={{ fontWeight: 500, fontSize: 12 }}>
                  {defaultAddress.recipient_name} - {defaultAddress.phone}
                </div>
                <Text
                  ellipsis
                  style={{
                    maxWidth: 220,
                    display: "block",
                    color: "#595959",
                    fontSize: 12,
                  }}
                >
                  {defaultAddress.location}
                </Text>
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Ngày tham gia",
      key: "created_at",
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (_, record) => (
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 500 }}>
            {dayjs(record.created_at).format("DD/MM/YYYY")}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(record.created_at).fromNow()}
          </Text>
        </div>
      ),
    },
    {
      title: "Tác vụ",
      key: "actions",
      width: 150,
      fixed: isMobile ? undefined : "right",
      align: "center",
      render: (_, record) => (
        <Space size={2} onClick={(e) => e.stopPropagation()}>
          {/* Nút Xem chi tiết */}
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: "#595959" }} />}
              size="small"
              onClick={(e) => handleViewDetailClick(e, record)}
              loading={isFetchingDetail && detailUser?.id === record.id}
            />
          </Tooltip>

          {/* Nút Sửa */}
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              size="small"
              onClick={(e) => handleEditClick(e, record)}
              loading={isFetchingDetail && editingUser?.id === record.id}
            />
          </Tooltip>

          {/* Nút Khóa/Mở */}
          <Tooltip title={record.is_active ? "Khóa tài khoản" : "Mở khóa"}>
            <Button
              type="text"
              icon={
                record.is_active ? (
                  <UnlockOutlined style={{ color: "#52c41a" }} />
                ) : (
                  <LockOutlined style={{ color: "#ff4d4f" }} />
                )
              }
              size="small"
              onClick={(e) => handleToggleUser(e, record)}
            />
          </Tooltip>

          {/* Nút Xóa */}
          <Tooltip
            title={
              record.role?.name === "admin"
                ? "Không thể xóa Admin"
                : "Xóa vĩnh viễn"
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.role?.name === "admin"}
              onClick={(e) => handleDeleteUser(e, record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* --- TABLE HIỂN THỊ --- */}
      <div
        className="user-table-container"
        style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            pageSize: 10,
            showTotal: (t) => `Tổng ${t} users`,
            showSizeChanger: true,
          }}
          scroll={{ x: 1100 }}
          bordered={false}
          onRow={(record) => ({
            onClick: () => handleViewDetailClick(null, record), // Click vào row tương đương click nút mắt
            style: { cursor: "pointer" },
          })}
        />
      </div>

      {/* --- MODAL ADD NEW --- */}
      <UserAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />

      {/* --- DRAWER EDIT --- */}
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
        styles={{ body: { paddingBottom: 80 } }}
      >
        {isFetchingDetail && !editingUser?.email ? (
          <div style={{ textAlign: "center", marginTop: 50 }}>
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

      {/* --- USER DETAIL ROW / MODAL --- 
          Đã đưa ra ngoài Drawer để hoạt động độc lập 
      */}
      <UserDetailRow
        visible={!!detailUser} // Hiển thị khi detailUser có dữ liệu
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onUpdate={handleUpdateLocalList} // Đồng bộ lại list khi sửa từ trang chi tiết
      />
    </>
  );
}
