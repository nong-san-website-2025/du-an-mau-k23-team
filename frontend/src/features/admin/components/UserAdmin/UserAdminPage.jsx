import React, { useEffect, useState } from "react";
import UserSidebar from "./UserSidebar";
import UserTable from "./UserTable"; // Import bảng user

export default function UserAdminPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy CSRF token từ cookie
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  // Lấy JWT token từ localStorage
  const accessToken = localStorage.getItem('token');
  const csrfToken = getCookie('csrftoken'); // Lấy CSRF token từ cookie

  // Fetch danh sách vai trò từ backend
  useEffect(() => {
    fetch("http://localhost:8000/api/users/roles/list/", {
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Gửi JWT token trong header
        'X-CSRFToken': csrfToken, // Gửi CSRF token trong header
      },
    })
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(error => console.error('Error fetching roles:', error));
  }, [accessToken, csrfToken]);

  // Fetch danh sách user từ backend
  useEffect(() => {
    fetch("http://localhost:8000/api/users/", {
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Gửi JWT token trong header
        'X-CSRFToken': csrfToken, // Gửi CSRF token trong header
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log("User data:", data); // Thêm dòng này
        setUsers(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [accessToken, csrfToken]);

  // Reload vai trò sau khi tạo mới
  const handleRoleCreated = () => {
    fetch("http://localhost:8000/api/users/roles/list/", {
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Gửi JWT token trong header
        'X-CSRFToken': csrfToken, // Gửi CSRF token trong header
      },
    })
      .then(res => res.json())
      .then(data => setRoles(data))
      .catch(error => console.error('Error fetching roles after creation:', error));
  };

  return (
    <div>
      <UserSidebar
        roles={roles}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        onRoleCreated={handleRoleCreated}
      />
      <UserTable
        users={users}
        loading={loading}
        selectedRole={selectedRole}
        // ...truyền các prop khác nếu cần...
      />
    </div>
  );
}
