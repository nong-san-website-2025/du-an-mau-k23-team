// pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import { Search, Plus, HelpCircle } from "lucide-react";
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

  // Fetch users
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

  // Fetch roles
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

  // Delete selected users
  const handleDeleteSelected = async () => {
    if (checkedIds.length === 0) return;
    if (
      !window.confirm(
        t("users_page.confirm_delete", { count: checkedIds.length })
      )
    )
      return;

    try {
      for (const id of checkedIds) {
        await axios.delete(`http://localhost:8000/api/users/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      setUsers((prev) => prev.filter((u) => !checkedIds.includes(u.id)));
      setCheckedIds([]);
      alert(t("users_page.delete_success"));
    } catch (err) {
      console.error(err);
      alert(t("users_page.delete_failed"));
    }
  };

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
      <div className="container py-3">
        {/* ===================== Filter + Create Role ===================== */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <UserSideBar
            roles={roles}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onRoleCreated={() => {
              fetchRoles();
              fetchUsers();
            }}
          />
        </div>

        {/* ===================== Toolbar (Search + Buttons) ===================== */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div className="position-relative" style={{ flex: 1, minWidth: 250 }}>
            <Search
              size={16}
              className="position-absolute"
              style={{
                top: "50%",
                left: 10,
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            />
            <input
              type="text"
              className="form-control ps-5"
              placeholder={t("users_page.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minHeight: 40 }}
            />
          </div>

          <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
            {checkedIds.length > 0 ? (
              <button className="btn btn-danger" onClick={handleDeleteSelected}>
                {t("users_page.delete_selected")} ({checkedIds.length})
              </button>
            ) : (
              <>
                <button className="btn btn-light" title={t("users_page.help")}>
                  <HelpCircle size={16} />
                </button>
                <button
                  className="btn text-white"
                  style={{ backgroundColor: "#0c0febff", fontWeight: 600 }}
                  onClick={() => setTriggerAddUser(true)}
                >
                  <Plus size={20} className="me-2" /> {t("users_page.add_user")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ===================== User Table ===================== */}
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

        {/* ===================== User Detail Modal ===================== */}
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            visible={showDetailModal} // state quản lý mở/đóng
            onClose={() => setShowDetailModal(false)}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </div>
    </AdminPageLayout>
  );
}
