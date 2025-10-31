import React from "react";
import { Dropdown, Menu, Button, Popconfirm } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  MoreOutlined,
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

  const menu = (
    <Menu>
      <Menu.Item
        key="approve"
        icon={<CheckOutlined />}
        disabled={isApproved || isLocked || isRejected || isActive}
        onClick={() => onApprove(record)}
      >
        Duyệt cửa hàng
      </Menu.Item>

      <Menu.Item
        key="reject"
        icon={<CloseOutlined />}
        disabled={isApproved || isLocked || isRejected || isActive}
        onClick={() => onReject(record)}
      >
        Từ chối cửa hàng
      </Menu.Item>

      <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => onView(record)}>
        Xem chi tiết
      </Menu.Item>

      <Menu.Item
        key="lock"
        icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
        disabled={isApproved || isRejected || isPending}
      >
        <Popconfirm
          title={`Bạn có chắc muốn ${
            isActive ? "khóa" : "mở khóa"
          } cửa hàng này?`}
          onConfirm={handleLockToggle}
          okText="Có"
          cancelText="Hủy"
        >
          {isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <Button icon={<MoreOutlined />} />
    </Dropdown>
  );
};

export default SellerActions;
