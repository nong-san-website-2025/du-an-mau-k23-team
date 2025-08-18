import React from "react";

export default function UserTableRow({ user, checked, onCheck, onDetail }) {
  return (
    <tr>
      <td>
        <input
          type="checkbox"
          className="form-check-input"
          checked={checked}
          onChange={onCheck}
        />
      </td>
      <td>{user.username}</td>
      <td>{user.email}</td>
      <td>{user.phone || ""}</td>
      <td>{user.role ? user.role.name : "Chưa có"}</td>
      <td>
        {user.status
          ? user.status === "active"
            ? "Đang hoạt động"
            : user.status === "inactive"
            ? "Ngừng hoạt động"
            : user.status
          : "Chưa có"}
      </td>
      <td>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onDetail}
        >
          Chi tiết
        </button>
      </td>
    </tr>
  );
}
