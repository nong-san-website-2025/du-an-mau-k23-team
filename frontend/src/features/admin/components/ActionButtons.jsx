import React, { useState } from "react";
import { Button, Tooltip, Popconfirm, message, Space } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
  UnlockOutlined,
  PlayCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import SellerRejectionModal from "./SellerAdmin/SellerRejectionModal";

/**
 * ✅ Component dùng chung cho tất cả loại action: product, seller, user, ...
 * Tự động hiện nút nào có props được truyền vào.
 */
const ActionButtons = ({
  record,
  type = "item",
  statusField = "status",
  size = "small",
  onApprove,
  onReject,
  onToggleBan,
  onView,
}) => {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const status = record?.[statusField] || "pending";

  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isPending = status === "pending";
  const isBanned = status === "banned";
  const isActive = status === "active";
  const isLocked = status === "locked";

  const confirmAction = (title, callback, successMsg) => ({
    title,
    okText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: (e) => {
      e?.stopPropagation();
      callback(record);
      if (successMsg) message.success(successMsg);
    },
    onCancel: (e) => e?.stopPropagation(),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Space size={6}>
        {/* ✅ Duyệt */}
        {onApprove && (
          <Tooltip title={`Duyệt ${type}`}>
            <Popconfirm
              {...confirmAction(
                `Duyệt ${type} này?`,
                onApprove,
                `Đã duyệt ${type}!`
              )}
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size={size}
                disabled={isApproved || isRejected || isBanned || isLocked}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
        )}

        {/* ❌ Từ chối */}
        {onReject && (
          <>
            <Tooltip title={`Từ chối ${type}`}>
              <Button
                danger
                icon={<CloseOutlined />}
                size={size}
                disabled={isApproved || isRejected || isBanned || isLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  setRejectModalVisible(true);
                }}
              />
            </Tooltip>
            {type === "cửa hàng" && (
              <SellerRejectionModal
                visible={rejectModalVisible}
                onClose={() => setRejectModalVisible(false)}
                seller={record}
                onRejectSuccess={() => {
                  onReject(record);
                  setRejectModalVisible(false);
                }}
              />
            )}
            {type !== "cửa hàng" && (
              <Popconfirm
                {...confirmAction(
                  `Từ chối ${type} này?`,
                  onReject,
                  `Đã từ chối ${type}.`
                )}
                open={rejectModalVisible}
                onOpenChange={setRejectModalVisible}
              >
                <span style={{ display: "none" }} />
              </Popconfirm>
            )}
          </>
        )}

        {/* 🚫 / 🔓 Khoá / Mở khoá */}
        {onToggleBan && (
          <Tooltip
            title={isBanned || isLocked ? `Mở khoá ${type}` : `Khoá ${type}`}
          >
            <Popconfirm
              {...confirmAction(
                `${isBanned || isLocked ? "Mở khoá" : "Khoá"} ${type} này?`,
                onToggleBan,
                isBanned || isLocked
                  ? `Đã mở khoá ${type}!`
                  : `Đã khoá ${type}!`
              )}
            >
              <Button
                icon={
                  isBanned || isLocked ? (
                    <UnlockOutlined style={{ color: "#52c41a" }} />
                  ) : (
                    <StopOutlined style={{ color: "#ff4d4f" }} />
                  )
                }
                size={size}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
        )}
      </Space>
    </motion.div>
  );
};

export default ActionButtons;
