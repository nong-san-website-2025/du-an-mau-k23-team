// src/features/stores/components/StoreDetail/ProductSearchBar.jsx
import React from "react";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const ProductSearchBar = ({ searchQuery, onSearchChange }) => {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
      <Input
        placeholder="Tìm trong cửa hàng..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 280 }}
        allowClear
        prefix={<SearchOutlined />}
        onPressEnter={(e) => {
          // Optional: nếu bạn muốn xử lý "Enter" như nút Tìm
          // onSearchChange(e.target.value);
        }}
      />
    </div>
  );
};

export default ProductSearchBar;