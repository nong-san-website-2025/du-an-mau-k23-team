// pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import { Search, Plus, Import, FileUp, HelpCircle } from "lucide-react";
import AdminPageLayout from "../components/AdminPageLayout";
import AdminHeader from "../components/AdminHeader";
import UserSideBar from "../components/UserAdmin/UserSidebar";
import UserTable from "../components/UserAdmin/UserTable";
import UserDetailModal from "../components/UserAdmin/UserDetailRow";
import axios from "axios";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ chỉ giữ triggerAddUser
  const [triggerAddUser, setTriggerAddUser] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/users/");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users/roles/list/");
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi fetch roles:", err);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleDeleteSelected = async () => {
  if (checkedIds.length === 0) return;

  if (!window.confirm(`Bạn có chắc muốn xoá ${checkedIds.length} người dùng?`)) {
    return;
  }

  try {
    console.log("👉 Gọi API xoá:", checkedIds);

    // ✅ Nếu backend chỉ hỗ trợ DELETE từng user
    for (const userId of checkedIds) {
      await axios.delete(`http://localhost:8000/api/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    }

    // ✅ Xoá khỏi state để cập nhật UI
    setUsers((prev) => prev.filter((u) => !checkedIds.includes(u.id)));
    setCheckedIds([]);
    alert("Đã xoá thành công!");
  } catch (err) {
    console.error("❌ Lỗi xoá user:", err.response?.data || err.message);
    alert("Xoá thất bại!");
  }
};


  return (
    <AdminPageLayout
      header={<AdminHeader />}
      sidebar={
        <UserSideBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          roles={roles}
          onRoleCreated={() => {
            fetchRoles();
            fetchUsers();
          }}
        />
      }
    >
      <div className="bg-white" style={{ minHeight: "100vh" }}>
        {/* Toolbar */}
        <div className="p-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-0 gap-2 flex-wrap">
            <div style={{ flex: 1 }}>
              <div className="input-group" style={{ width: 420 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    top: "30px",
                    zIndex: 11,
                    left: "10px",
                  }}
                />
                <input
                  className="form-control"
                  placeholder="Tìm kiếm người dùng"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    height: "20px",
                    width: "400px",
                    padding: "17px 35px",
                    border: "1px solid #ccc",
                    marginTop: "20px",
                    position: "relative",
                    borderRadius: "8px",
                  }}
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
              {checkedIds.length > 0 ? (
                <button
                  className="btn btn-danger border"
                  onClick={handleDeleteSelected} // ✅ Gọi hàm xoá nhiều
                >
                  Xoá ({checkedIds.length})
                </button>
              ) : (
                <>
                  <button className="btn btn-light border">
                    <Import size={16} /> Nhập file
                  </button>
                  <button className="btn btn-light border">
                    <FileUp size={16} /> Xuất file
                  </button>
                  <button className="btn btn-light border">
                    <HelpCircle size={16} />
                  </button>
                  {/* ✅ nút thêm user bắn trigger */}
                  <button
                    className="btn"
                    style={{
                      backgroundColor: "#22C55E",
                      color: "#fff",
                      fontWeight: "600",
                    }}
                    onClick={() => setTriggerAddUser(true)} // ✅ mở modal
                  >
                    <Plus size={20} className="me-2" /> Thêm người dùng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-1">
          <UserTable
            users={users}
            setUsers={setUsers}
            loading={loading}
            selectedRole={selectedRole}
            searchTerm={searchTerm}
            roles={roles}
            checkedIds={checkedIds}
            setCheckedIds={setCheckedIds}
            onShowDetail={setSelectedUser}
            triggerAddUser={triggerAddUser} // ✅ truyền xuống
            setTriggerAddUser={setTriggerAddUser} // ✅ để reset khi modal mở
          />

          {/* Modal chi tiết */}
          {selectedUser && (
            <UserDetailModal
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onUserUpdated={fetchUsers}
            />
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
