import React from "react";
import {
  Dropdown,
  Menu,
  Button,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  StopOutlined,
  UnlockOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion"; // 👈 dùng cho hiệu ứng nhẹ

const ProductActions = ({
  record,
  onApprove,
  onReject,
  onView,
  onToggleBan,
}) => {
  const isApproved = record.status === "approved";
  const isRejected = record.status === "rejected";
  const isPending = record.status === "pending";
  const isBanned = record.status === "banned";

  // ⚙️ Hàm hiển thị trạng thái tiếng Việt (cho tooltip hoặc tag)


  // 📋 Menu phụ (Xem, Khoá/Mở khoá)
  const menu = (
    <Menu
      style={{
        minWidth: 180,
        borderRadius: 8,
        padding: 6,
      }}
    >
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
          icon={<UnlockOutlined style={{ color: "#52c41a" }} />}
          onClick={() => onToggleBan(record)}
        >
          Mở khoá sản phẩm
        </Menu.Item>
      ) : (
        <Menu.Item
          key="ban"
          icon={<StopOutlined style={{ color: "#ff4d4f" }} />}
          onClick={() => onToggleBan(record)}
        >
          Khoá sản phẩm
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
      }}
    >
      {/* ✅ Duyệt sản phẩm */}
      <Tooltip title="Duyệt sản phẩm">
        <Popconfirm
          title="Bạn có chắc muốn duyệt sản phẩm này?"
          okText="Duyệt"
          cancelText="Hủy"
          onConfirm={() => {
            onApprove(record);
            message.success("Đã duyệt sản phẩm!");
          }}
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            disabled={isApproved || isRejected || isBanned}
          />
        </Popconfirm>
      </Tooltip>

      {/* ❌ Từ chối sản phẩm */}
      <Tooltip title="Từ chối sản phẩm">
        <Popconfirm
          title="Bạn có chắc muốn từ chối sản phẩm này?"
          okText="Từ chối"
          cancelText="Hủy"
          onConfirm={() => {
            onReject(record);
            message.info("Đã từ chối sản phẩm.");
          }}
        >
          <Button
            danger
            icon={<CloseOutlined />}
            size="small"
            disabled={isApproved || isRejected || isBanned}
          />
        </Popconfirm>
      </Tooltip>

      {/* 🔽 Các hành động phụ */}
      <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
        <Tooltip title="Hành động khác">
          <Button
            icon={<MoreOutlined />}
            size="small"
            style={{
              borderRadius: 6,
            }}
          />
        </Tooltip>
      </Dropdown>
    </motion.div>
  );
};

export default ProductActions;
