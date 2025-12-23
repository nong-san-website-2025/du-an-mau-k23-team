import React, { useMemo, useState, useEffect } from "react";
import { Table, Modal, message, Tag, Avatar, Drawer, Spin } from "antd";
import {
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Import các component con
import UserAddModal from "./UserAddModal";
import ButtonAction from "../../../../components/ButtonAction";
import StatusTag from "../../../../components/StatusTag";

// Import Form Sửa
import UserEditForm from "../../components/UserAdmin/components/UserForms/UserEditForm";
import { fetchRoles } from "./api/userApi";

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
  const { confirm } = Modal;
  const [isMobile, setIsMobile] = useState(false);

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;

  // --- STATE QUẢN LÝ ---
  const [editingUser, setEditingUser] = useState(null); // User đang được chọn để sửa
  const [isFetchingDetail, setIsFetchingDetail] = useState(false); // Loading khi đang lấy chi tiết user
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Preload roles so edit can show role select immediately
  // Note: Kiểm tra file "./api/userApi" để đảm bảo fetchRoles cũng dùng env nhé
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

    // Detect mobile viewport (iPhone 14 Pro Max ~430px width)
    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener ? mql.addEventListener("change", handleChange) : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", handleChange) : mql.removeListener(handleChange);
      mounted = false;
    };
  }, []);

  // --- LOGIC SEARCH & FILTER ---
  const norm = (v) =>
    (v ?? "").toString().normalize("NFC").toLowerCase().trim();

  const filteredUsers = useMemo(() => {
    const s = norm(searchTerm);
    return (Array.isArray(users) ? users : []).filter((u) => {
      if (selectedRole !== "all") {
        let roleMatch = false;
        const roleName = u?.role?.name?.toLowerCase();
        if (selectedRole === "customer") {
          roleMatch = roleName === "customer";
        } else if (selectedRole === "seller") {
          roleMatch = roleName === "seller";
        } else if (selectedRole === "admin") {
          roleMatch = roleName === "admin";
        }
        if (!roleMatch) return false;
      }
      if (statusFilter !== "all") {
        const statusMatch =
          statusFilter === "active" ? u.is_active : !u.is_active;
        if (!statusMatch) return false;
      }
      const hitSearch =
        s === "" ||
        norm(u.username).includes(s) ||
        norm(u.full_name).includes(s) ||
        norm(u.email).includes(s) ||
        norm(u.phone).includes(s);
      return hitSearch;
    });
  }, [users, searchTerm, selectedRole, statusFilter]);

  const rowSelection = {
    selectedRowKeys: checkedIds,
    onChange: (keys) => setCheckedIds(keys),
    getCheckboxProps: (record) => ({
      disabled: record?.role?.name?.toLowerCase() === "admin",
    }),
  };

  // --- LOGIC 1: LẤY CHI TIẾT USER ĐỂ SỬA (FIX LỖI HIỂN THỊ ID) ---
  const handleEditClick = async (record) => {
    // Bật trạng thái loading
    setIsFetchingDetail(true);
    try {
      const token = localStorage.getItem("token");
      // SỬ DỤNG ENV Ở ĐÂY
      const response = await axios.get(
        `${API_URL}/users/management/${record.id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Mở Drawer với dữ liệu đầy đủ vừa tải về
      setEditingUser(response.data);
    } catch (error) {
      console.error("Lỗi lấy chi tiết user:", error);

      // Fallback: Nếu lỗi mạng, dùng tạm dữ liệu từ bảng (dù có thể hiển thị chưa đẹp)
      setEditingUser(record);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleEditSave = (updatedUser) => {
    // Cập nhật lại danh sách sau khi lưu thành công
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setEditingUser(null);
  };

  // --- LOGIC 2: KHÓA/MỞ KHÓA TÀI KHOẢN ---
  const handleToggleUser = async (user) => {
    try {
      // SỬ DỤNG ENV Ở ĐÂY
      const res = await axios.patch(
        `${API_URL}/users/toggle-active/${user.id}/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: res.data.is_active } : u
        )
      );
      message.success(
        res.data.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"
      );
    } catch (err) {
      console.error(err);
      message.error("Không thể thay đổi trạng thái user");
    }
  };

  // --- LOGIC 3: XÓA USER ---
  const handleDeleteUser = (user) => {
    if (!user?.id) return;
    confirm({
      title: `Bạn có chắc chắn muốn xóa người dùng "${user.username}"?`,
      icon: <ExclamationCircleOutlined />,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          // SỬ DỤNG ENV Ở ĐÂY
          await axios.delete(`${API_URL}/users/management/${user.id}/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setCheckedIds((prev) => prev.filter((id) => id !== user.id));
          message.success("Xóa người dùng thành công!");
        } catch (err) {
          console.error(err);
          message.error("Xóa người dùng thất bại!");
        }
      },
    });
  };

  // --- LOGIC 4: THÊM USER MỚI ---
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

  // --- CẤU HÌNH ACTIONS ---
  const getActions = (record) => [
    {
      show: true,
      actionType: "edit",
      // Nếu đang loading đúng dòng này thì hiển thị icon loading
      icon: isFetchingDetail ? <LoadingOutlined /> : <EditOutlined />,
      tooltip: "Chỉnh sửa",
      // SỬ DỤNG HÀM FETCH CHI TIẾT
      onClick: () => handleEditClick(record),
    },
    {
      show: true,
      actionType: "lock",
      icon: record.is_active ? <LockOutlined /> : <UnlockOutlined />,
      tooltip: record.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản",
      onClick: () => handleToggleUser(record),
      confirm: {
        title: record.is_active
          ? "Bạn có chắc muốn khóa?"
          : "Bạn có chắc muốn mở khóa?",
        okText: "Xác nhận",
        cancelText: "Hủy",
        okButtonProps: { danger: record.is_active },
      },
    },
    (() => {
      // Determine why delete should be disabled, prefer explicit server-side `can_delete`
      const cannotDeleteReason = (() => {
        if (record?.role?.name && String(record.role.name).toLowerCase() === "admin")
          return "Không thể xóa: tài khoản quản trị";
        if (record?.can_delete === false)
          return "Không thể xóa: người dùng đã có hoạt động trong hệ thống";
        if (record?.orders_count && Number(record.orders_count) > 0)
          return "Không thể xóa: đã phát sinh đơn hàng";
        if (record?.wallet_balance && Number(record.wallet_balance) > 0)
          return "Không thể xóa: còn số dư trong ví";
        if (record?.total_spent && Number(record.total_spent) > 0)
          return "Không thể xóa: đã phát sinh giao dịch";
        return null;
      })();

      const disabled = Boolean(cannotDeleteReason);

      return {
        show: true,
        actionType: "delete",
        icon: <DeleteOutlined />,
        tooltip: disabled ? (cannotDeleteReason || "Không thể xóa") : "Xóa tài khoản",
        onClick: () => handleDeleteUser(record),
        // Provide disabled flag and reason for ButtonAction to render nicer UI
        buttonProps: {
          danger: true,
          disabled,
          style: disabled ? { opacity: 0.65, cursor: "not-allowed" } : {},
        },
        disabledReason: cannotDeleteReason,
      };
    })(),
  ];

  // --- CẤU HÌNH CỘT ---
  const columns = [
    {
      title: "Người dùng",
      key: "user",
      width: 240,
      // Disable fixed column on mobile to avoid overlay
      fixed: isMobile ? undefined : "left",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={record.avatar} size={40}>
            {record.full_name?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.full_name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>@{record.username}</div>
          </div>
        </div>
      ),
    },
    // Cột 2: Liên hệ (Contact) - Tách riêng ra
    {
      title: "Liên hệ",
      key: "contact",
      width: 220,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Email */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <MailOutlined style={{ color: "#1890ff" }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }} title={record.email}>
              {record.email || "—"}
            </span>
          </div>
          {/* Phone */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <PhoneOutlined style={{ color: "#52c41a" }} />
            <span>{record.phone || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      key: "role",
      width: 120,
      align: "center",
      render: (_, record) => {
        const rawRole = record.role?.name ?? "";
        const roleKey = rawRole.toString().toLowerCase();

        let displayRole = rawRole || "—";
        let color = "default";

        if (roleKey === "seller") {
          displayRole = "Người bán";
          color = "orange";
        } else if (roleKey === "customer") {
          displayRole = "Khách hàng";
          color = "blue";
        } else if (roleKey === "admin") {
          displayRole = "Admin";
          color = "red";
        }

        return (
          <Tag color={color} style={{ borderRadius: 4, minWidth: 80, textAlign: 'center' }}>
            {displayRole}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tham gia", // Cột mới thay thế cho Activity
      key: "created_at",
      width: 150,
      align: "center",
      render: (_, record) => {
        // Lưu ý: Kiểm tra lại tên trường ngày tháng từ API của bạn (date_joined hoặc created_at)
        const dateVal = record.date_joined || record.created_at;
        return (
          <div style={{ color: "#595959" }}>
            {dateVal ? (
              <>
                <CalendarOutlined style={{ marginRight: 6, color: "#8c8c8c" }} />
                {new Date(dateVal).toLocaleDateString("vi-VN")}
              </>
            ) : "—"}
          </div>
        );
      }
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <StatusTag status={record.is_active ? "active" : "locked"} />
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      // Disable fixed column on mobile to avoid overlay
      fixed: isMobile ? undefined : "right",
      align: "center",
      render: (_, record) => (
        <ButtonAction actions={getActions(record)} record={record} />
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} người dùng`,
        }}
        bordered
        size={isMobile ? "small" : "middle"}
        tableLayout="fixed"
        // Ensure horizontal scroll on mobile without overlapping fixed columns
        scroll={isMobile ? { x: 1000 } : { x: 1200 }}
        style={isMobile ? { background: "#fff", whiteSpace: "nowrap" } : { background: "#fff" }}
        onRow={onRow}
      />

      {/* Modal Thêm User */}
      {showAddModal && (
        <UserAddModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onUserAdded={handleUserAdded}
        />
      )}

      {/* Drawer Edit User */}
      <Drawer
        title={`Sửa thông tin: ${editingUser?.full_name || editingUser?.username || "..."
          }`}
        placement="right"
        width={Math.min(800, window.innerWidth)}
        onClose={() => setEditingUser(null)}
        open={!!editingUser}
        destroyOnClose={true} // Reset form khi đóng
        bodyStyle={{ padding: 0 }}
        // Hiển thị thêm loading overlay nếu đang fetch (phòng hờ)
        extra={isFetchingDetail && <Spin size="small" />}
      >
        {editingUser && (
          <UserEditForm
            editUser={editingUser}
            roles={roles}
            rolesLoading={rolesLoading}
            onCancel={() => setEditingUser(null)}
            onSave={handleEditSave}
          />
        )}
      </Drawer>
    </>
  );
}