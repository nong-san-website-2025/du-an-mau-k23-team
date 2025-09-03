import React, { useState } from "react";
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

const SellerSelect = ({ onChange }) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value) => {
    if (!value) return;
    setLoading(true);
    try {
      const res = await api.get(`/sellers/search/?q=${value}`, {
        headers: getAuthHeaders(),
      });
      setSellers(res.data);
    } catch (err) {
      message.error("Không tải được danh sách cửa hàng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      showSearch
      placeholder="Tìm cửa hàng..."
      style={{ width: 200 }}
      filterOption={false}
      onSearch={handleSearch}
      onChange={onChange}
      allowClear
      notFoundContent={loading ? <Spin size="small" /> : null}
    >
      {sellers.map((s) => (
        <Option key={s.id} value={s.id}>
          {s.store_name}
        </Option>
      ))}
    </Select>
  );
};

export default SellerSelect;
