import React from "react";
import { Button, Popconfirm, Space, Tooltip } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";

const SellerActions = ({ record, onApprove, onReject, onView, onLock }) => {
  const isApproved = record.status === "approved";
  const isRejected = record.status === "rejected";
  const isLocked = record.status === "locked";
  const isActive = record.status === "active";
  const isPending = record.status === "pending";

  const handleLockToggle = async () => {
    try {
      await onLock(record);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Space size="small">

      {/* ✅ Duyệt */}
      <Tooltip title="Duyệt cửa hàng">
        <Button
          icon={<CheckOutlined />}
          type="primary"
          size="small"
          disabled={isApproved || isLocked || isRejected || isActive}
          onClick={() => onApprove(record)}
        />
      </Tooltip>

      {/* ❌ Từ chối */}
      <Tooltip title="Từ chối cửa hàng">
        <Button
          icon={<CloseOutlined />}
          type="default"
          danger
          size="small"
          disabled={isApproved || isLocked || isRejected || isActive}
          onClick={() => onReject(record)}
        />
      </Tooltip>

      {/* 🔒 / 🔓 Khóa / Mở khóa */}
      <Tooltip title={isActive ? "Khóa cửa hàng" : "Mở khóa cửa hàng"}>
        <Popconfirm
          title={`Bạn có chắc muốn ${
            isActive ? "khóa" : "mở khóa"
          } cửa hàng này?`}
          onConfirm={handleLockToggle}
          okText="Có"
          cancelText="Hủy"
        >
          <Button
            icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
            type={isActive ? "default" : "primary"}
            size="small"
            disabled={isApproved || isRejected || isPending}
          />
        </Popconfirm>
      </Tooltip>
    </Space>
  );
};

export default SellerActions;
