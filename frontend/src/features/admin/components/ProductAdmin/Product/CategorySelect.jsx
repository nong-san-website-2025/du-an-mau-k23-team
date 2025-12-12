// src/features/admin/components/Product/CategorySelect.jsx
import React, { useState, useEffect } from "react";
import { Select, Spin, message } from "antd";
import axios from "axios";

const { Option } = Select;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CategorySelect = ({ onChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách danh mục từ backend
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("products/categories/", { headers: getAuthHeaders() });
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <Select
      showSearch
      placeholder="Chọn danh mục..."
      style={{ width: 180 }}
      filterOption={(input, option) =>
        (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
      }
      onChange={onChange}
      allowClear
      loading={loading}
    >
      {categories.map((c) => (
        <Option key={c.id} value={c.id}>
          {c.name}
        </Option>
      ))}
    </Select>
  );
};

export default CategorySelect;
