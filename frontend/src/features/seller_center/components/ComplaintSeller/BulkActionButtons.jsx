import React from "react";
import { Button, Space } from "antd";

const BulkActionButtons = ({ selectedCount, onBulkResolve, onBulkReject }) => {
  if (selectedCount < 2) return null;

  return (
    <Space>
      <Button type="primary" onClick={onBulkResolve}>
        Xử lý tất cả ({selectedCount})
      </Button>
      <Button danger onClick={onBulkReject}>
        Từ chối tất cả ({selectedCount})
      </Button>
    </Space>
  );
};

export default BulkActionButtons;