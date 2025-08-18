// components/UserAdmin/UserTable.jsx
import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import UserAddModal from "./UserAddModal";

export default function UserTable({
  users = [],
  setUsers,
  loading = false,
  selectedRole = "all",
  searchTerm = "",
  roles = [],
  UserTableActions,
  checkedIds = [],
  setCheckedIds,
  onShowDetail,
  triggerAddUser,
  setTriggerAddUser, // (user) => void
}) {
  // --- Utils an toàn, tránh lỗi toLowerCase ---
  const norm = (v) =>
    (v ?? "").toString().normalize("NFC").toLowerCase().trim();
  const sameId = (a, b) => String(a ?? "") === String(b ?? "");

  const renderRole = (user) => {
  if (user?.is_admin) return <span className="badge bg-danger">Admin</span>;
  if (user?.is_seller) return <span className="badge bg-success">Seller</span>;
  if (user?.is_support) return <span className="badge bg-warning">Support</span>;
  return <span className="badge bg-secondary">User</span>;
};

  // --- Lọc theo searchTerm + role, hoàn toàn null-safe ---
  const filteredUsers = useMemo(() => {
    const s = norm(searchTerm);
    const roleKey =
      selectedRole === "all" || selectedRole === ""
        ? null
        : String(selectedRole);

    return (Array.isArray(users) ? users : []).filter((u) => {
      // text search
      const hitSearch =
        s === "" ||
        norm(u.username).includes(s) ||
        norm(u.full_name).includes(s) ||
        norm(u.email).includes(s) ||
        norm(u.phone).includes(s);

      // role filter
      const hitRole = !roleKey || sameId(roleKey, u?.role?.id);

      return hitSearch && hitRole;
    });
  }, [users, searchTerm, selectedRole]);

  // --- Chọn tất cả theo danh sách đang hiển thị ---
  const toggleCheckAll = (checked) => {
    const visibleIds = filteredUsers
      .map((u) => u?.id)
      .filter((id) => id !== undefined && id !== null);

    if (checked) {
      const set = new Set([...checkedIds, ...visibleIds]);
      setCheckedIds(Array.from(set));
    } else {
      setCheckedIds(checkedIds.filter((id) => !visibleIds.includes(id)));
    }
  };

  // --- Chọn từng dòng ---
  const toggleCheckOne = (id, checked) => {
    if (id === undefined || id === null) return;
    if (checked) setCheckedIds([...checkedIds, id]);
    else setCheckedIds(checkedIds.filter((x) => x !== id));
  };

  // --- Xoá user (giữ nguyên backend) ---
  const handleDeleteUser = async (user) => {
    if (!user?.id) return;
    if (!window.confirm(`Xoá người dùng "${user.username ?? user.id}"?`))
      return;
    try {
      await axios.delete(`http://localhost:8000/api/users/${user.id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      alert("Đã xoá user!");
    } catch (err) {
      console.error(err);
      alert("Xoá user thất bại!");
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);

  // đồng bộ trigger từ UsersPage
  useEffect(() => {
    if (triggerAddUser) {
      setShowAddModal(true);
      setTriggerAddUser(false); // reset lại
    }
  }, [triggerAddUser, setTriggerAddUser]);

  // thêm user thành công
  const handleUserAdded = (newUser) => {
    setUsers((prev) => [newUser, ...prev]); // thêm vào đầu danh sách
    setShowAddModal(false);
  };

  // --- Trạng thái hiển thị ---
  const isAllVisibleChecked =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => checkedIds.includes(u?.id));

  return (
    <div
      className="table-responsive"
      style={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      <table className="table table-hover" style={{ margin: 0 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th
              className="border-0 py-0"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#fff",
                height: 26,
              }}
            >
              <input
                type="checkbox"
                className="form-check-input"
                checked={isAllVisibleChecked}
                onChange={(e) => toggleCheckAll(e.target.checked)}
              />
            </th>
            <th
              className="border-0 py-0"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#fff",
                height: 26,
                fontSize: 12,
                fontWeight: 500,
                paddingLeft: 76, // giống ProductTable: avatar + tên
              }}
            >
              User
            </th>
            <th
              className="border-0 py-0"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#fff",
                height: 26,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Role
            </th>
            <th
              className="border-0 py-0"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#fff",
                height: 26,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Email
            </th>
            <th
              className="border-0 py-0"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#fff",
                height: 26,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              SĐT
            </th>
            {/* <th
              className="border-0 py-0"
              style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: 26, fontSize: 12, fontWeight: 500 }}
            >
              Trạng thái
            </th> */}
            <th
              className="border-0 py-0 text-muted"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#fff",
                height: 26,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                Không có user
              </td>
            </tr>
          ) : filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                Không có user phù hợp với bộ lọc
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => {
              const id = user?.id;
              return (
                <tr key={id ?? `u-${Math.random()}`}>
                  {/* Checkbox */}
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={checkedIds.includes(id)}
                      onChange={(e) => toggleCheckOne(id, e.target.checked)}
                    />
                  </td>

                  {/* Avatar + username + full name */}
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <div className="fw-bold">{user?.username || "—"}</div>
                        <small className="text-muted">
                          {user?.full_name || "No name"}
                        </small>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>{renderRole(user)}</td>

                  {/* Email */}
                  <td>{user?.email || "—"}</td>

                  {/* Phone */}
                  <td>{user?.phone || "Chưa có"}</td>

                  {/* Trạng thái */}
                  {/* <td>
                    <span className={`badge ${user?.is_active ? "bg-success" : "bg-danger"}`}>
                      {user?.is_active ? "Hoạt động" : "Khoá"}
                    </span>
                  </td> */}

                  {/* Thao tác */}
                  <td className="text-nowrap">
                    {UserTableActions ? (
                      <UserTableActions
                        user={user}
                        onShowDetail={() => onShowDetail?.(user)}
                        onDelete={() => handleDeleteUser(user)}
                      />
                    ) : (
                      <>
                        <button
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => onShowDetail?.(user)}
                        >
                          Chi tiết
                        </button>
                        {/* <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(user)}
                        >
                          Xoá
                        </button> */}
                      </>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {showAddModal && (
        <UserAddModal
          roles={roles}
          onClose={() => setShowAddModal(false)}
          onUserAdded={handleUserAdded}
        />
      )}
    </div>
  );
}
