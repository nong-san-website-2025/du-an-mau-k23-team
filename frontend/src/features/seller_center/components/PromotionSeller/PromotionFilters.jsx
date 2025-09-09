// src/features/seller_center/pages/PromotionSeller/PromotionFilters.jsx
import React from "react";
import { Input, Select } from "antd";

const { Search } = Input;
const { Option } = Select;

const PromotionFilters = ({ search, setSearch, typeFilter, setTypeFilter, statusFilter, setStatusFilter }) => {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
      <Search
        placeholder="Tìm kiếm theo tên hoặc mã"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 260 }}
        allowClear
      />

      <Select
        placeholder="Lọc theo trạng thái"
        value={statusFilter}
        onChange={setStatusFilter}
        style={{ width: 160 }}
        allowClear
      >
        <Option value="Sắp diễn ra">Sắp diễn ra</Option>
        <Option value="Đang chạy">Đang chạy</Option>
        <Option value="Hết hạn">Hết hạn</Option>
      </Select>

      <Select
        placeholder="Chọn loại khuyến mãi"
        value={typeFilter}
        onChange={setTypeFilter}
        style={{ width: 160 }}
        allowClear
      >
        <Option value="Promotion">Giảm tiền</Option>
        <Option value="Flash Sale">Giảm %</Option>
        <Option value="Voucher">Freeship</Option>
      </Select>
    </div>
  );
};

export default PromotionFilters;
