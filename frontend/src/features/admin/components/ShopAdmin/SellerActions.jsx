import React from "react";
import { Button, Space, Tooltip, Popconfirm } from "antd";
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
      await onLock(record); // onLock sẽ tự quyết định lock/unlock dựa vào record.status
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Space>
      <Tooltip title="Duyệt">
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => onApprove(record)}
          disabled={isApproved || isLocked || isRejected || isActive}
        />
      </Tooltip>

      <Tooltip title="Từ chối">
        <Button
          danger
          icon={<CloseOutlined />}
          onClick={() => onReject(record)}
          disabled={isApproved || isLocked || isRejected || isActive}
        />
      </Tooltip>

      <Tooltip title="Xem chi tiết">
        <Button icon={<EyeOutlined />} onClick={() => onView(record)} />
      </Tooltip>

      <Tooltip
        title={
          record.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"
        }
       
      >
        <Popconfirm
          title={`Bạn có chắc muốn ${record.status === "active" ? "khóa" : "mở khóa"} tài khoản này?`}
          onConfirm={handleLockToggle}
          okText="Có"
          cancelText="Hủy"
        >
          <Button
            danger={record.status === "active"}
            type={record.status === "locked" ? "default" : "primary"}
            icon={
              record.status === "active" ? <LockOutlined /> : <UnlockOutlined />
            }
             disabled={isApproved || isRejected || isPending}
          />
        </Popconfirm>
      </Tooltip>
    </Space>
  );
};

export default SellerActions;
