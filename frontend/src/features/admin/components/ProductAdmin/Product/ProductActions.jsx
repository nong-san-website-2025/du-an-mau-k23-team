// src/features/admin/components/ProductActions.jsx
import React from "react";
import { Dropdown, Menu, Button } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  StopOutlined,
  UnlockOutlined,
  MoreOutlined,
} from "@ant-design/icons";

const ProductActions = ({ record, onApprove, onReject, onView, onToggleBan }) => {
  const isApproved = record.status === "approved";
  const isRejected = record.status === "rejected";
  const isPending = record.status === "pending";
  const isBanned = record.status === "banned";

  const menu = (
    <Menu>
      <Menu.Item
        key="approve"
        icon={<CheckOutlined />}
        disabled={isApproved || isRejected || isBanned}
        onClick={() => onApprove(record)}
      >
        Duyệt sản phẩm
      </Menu.Item>

      <Menu.Item
        key="reject"
        icon={<CloseOutlined />}
        disabled={isApproved || isRejected || isBanned}
        onClick={() => onReject(record)}
      >
        Từ chối sản phẩm
      </Menu.Item>

      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => onView(record)}
      >
        Xem chi tiết
      </Menu.Item>

      {isBanned ? (
        <Menu.Item
          key="unban"
          icon={<UnlockOutlined />}
          onClick={() => onToggleBan(record)}
        >
          Mở khoá sản phẩm
        </Menu.Item>
      ) : (
        <Menu.Item
          key="ban"
          icon={<StopOutlined />}
          onClick={() => onToggleBan(record)}
        >
          Khoá sản phẩm
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <Button icon={<MoreOutlined />} />
    </Dropdown>
  );
};

export default ProductActions;
