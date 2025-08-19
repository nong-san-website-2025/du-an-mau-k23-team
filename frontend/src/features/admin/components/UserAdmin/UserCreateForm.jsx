import React, { useEffect, useState } from "react";

export default function UserCreateForm({ onUserCreated }) {
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "",
  });

  useEffect(() => {
    fetch("http://localhost:8000/api/users/roles/list/")
      .then(res => res.json())
      .then(data => setRoles(data));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    fetch("http://localhost:8000/api/users/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(data => {
        if (onUserCreated) onUserCreated(data);
        setForm({ username: "", email: "", password: "", role_id: "" });
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Tên đăng nhập:</label>
      <input name="username" value={form.username} onChange={handleChange} required />
      <label>Email:</label>
      <input name="email" value={form.email} onChange={handleChange} required />
      <label>Mật khẩu:</label>
      <input name="password" type="password" value={form.password} onChange={handleChange} required />
      <label>Vai trò:</label>
      <select name="role_id" value={form.role_id} onChange={handleChange} required>
        <option value="">Chọn vai trò</option>
        {roles.map(role => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>
      <button type="submit">Tạo người dùng</button>
    </form>
  );
}