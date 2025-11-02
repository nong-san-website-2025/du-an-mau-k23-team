// pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import UserSideBar from "../components/UserAdmin/UserSidebar";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/UserDetailRow";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Button, Row, Col, Input, Space } from "antd";
import AdminPageLayout from "../components/AdminPageLayout"; // ✅ Thêm layout
import "../styles/AdminPageLayout.css"

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [triggerAddUser, setTriggerAddUser] = useState(false);
  const { t } = useTranslation();
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/users/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/users/roles/list/",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  const handleShowDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  return (
    <AdminPageLayout
      title={t("QUẢN LÝ NGƯỜI DÙNG")}
      className="row-hover"
      // extra={
      //   <Button type="primary" onClick={() => setTriggerAddUser(true)}>
      //     + {t("Thêm người dùng")}
      //   </Button>
      // }
    >
      {/* Thanh công cụ lọc + tìm kiếm */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <UserSideBar
            roles={roles}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onRoleCreated={() => {
              fetchRoles();
              fetchUsers();
            }}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddUser={() => setTriggerAddUser(true)}
          />
        </Col>

        <Col xs={24} sm={12} md={10} lg={12}>
          <Input
            placeholder={t("Tìm kiếm người dùng...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>

        <Col xs={24} sm={24} md={6} lg={6}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              onClick={() => setTriggerAddUser(true)}
              className="w-100 w-md-auto"
            >
              + {t("Thêm người dùng")}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Bảng danh sách người dùng */}
      <UserTable
        users={users}
        setUsers={setUsers}
        loading={loading}
        selectedRole={selectedRole}
        searchTerm={searchTerm}
        roles={roles}
        checkedIds={checkedIds}
        setCheckedIds={setCheckedIds}
        triggerAddUser={triggerAddUser}
        setTriggerAddUser={setTriggerAddUser}
        onShowDetail={handleShowDetail}
        onRow={(record) => ({
          onClick: () => handleShowDetail(record),
        })}
      />

      {/* Modal chi tiết người dùng */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </AdminPageLayout>
  );
}
