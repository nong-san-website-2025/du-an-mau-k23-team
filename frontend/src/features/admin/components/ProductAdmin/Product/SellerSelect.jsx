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

const SellerSelect = ({ onChange, value, style }) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Nếu có value (id) truyền vào, tải thông tin seller để hiển thị label
  React.useEffect(() => {
    let mounted = true;
    if (!value) return;
    (async () => {
      try {
        const res = await api.get(`/sellers/${value}/`, { headers: getAuthHeaders() });
        if (!mounted) return;
        setSellers([res.data]);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [value]);

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
      style={style || { width: 200 }}
      value={value ?? undefined}
      filterOption={false}
      onSearch={handleSearch}
      onChange={onChange}
      allowClear
      notFoundContent={loading ? <Spin size="small" /> : null}
    >
      {sellers.map((s) => (
        <Option key={s.id} value={`${s.id}`}>
          {s.store_name}
        </Option>
      ))}
    </Select>
  );
};

export default SellerSelect;
