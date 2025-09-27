// pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import AdminPageLayout from "../components/AdminPageLayout";
import UserSideBar from "../components/UserAdmin/UserSidebar";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/UserDetailRow";
import axios from "axios";
import { useTranslation } from "react-i18next";

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
    <AdminPageLayout>
      <div className="container-fluid py-3 px-3">
        <h2 className="mb-4">{t("Quản lý người dùng") || "Quản lý người dùng"}</h2>
        {/* ===================== Toolbar ===================== */}
        <div className="row g-2 mb-3 align-items-center">
          <div className="col-12 col-md-4 col-lg-3" style={{ height: 40 }}>
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
          </div>

          <div className="col-12 col-md-5 col-lg-6">
            <input
              type="text"
              className="form-control"
              placeholder={t("Tìm kiếm người dùng...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minHeight: 40   }}
            />
          </div>

          <div className="col-12 col-md-3 col-lg-3 text-md-end">
            <button
              className="btn text-white w-100 w-md-auto"
              style={{ backgroundColor: "#0c0febff", fontWeight: 600 }}
              onClick={() => setTriggerAddUser(true)}
            >
              + {t("Thêm người dùng")}
            </button>
          </div>
        </div>

        {/* ===================== User Table ===================== */}
        <div className="table-responsive">
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
          />
        </div>

        {/* ===================== User Detail Modal ===================== */}
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            visible={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </div>
    </AdminPageLayout>
  );
}
