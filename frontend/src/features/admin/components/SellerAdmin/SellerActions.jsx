import React, { useState } from "react";
import { Button, Popconfirm, Space, Tooltip } from "antd";
import {
  CheckCircleTwoTone,
  CheckOutlined,
  CloseCircleTwoTone,
  CloseOutlined,
  EyeOutlined,
  EyeTwoTone,
  LockOutlined,
  PlayCircleOutlined,
  StopOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import SellerRejectionModal from "./SellerRejectionModal";

const SellerActions = ({ record, onApprove, onReject, onView, onLock }) => {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
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
      <Tooltip title="Duyệt cửa hàng">
        <Button
          icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
          type="text"
          size="small"
          onClick={() => onApprove(record)}
          disabled={isApproved || isLocked || isRejected || isActive}
        />
      </Tooltip>

      <Tooltip title="Từ chối cửa hàng">
        <Button
          icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />}
          type="text"
          size="small"
          onClick={() => setRejectModalVisible(true)}
          disabled={isApproved || isLocked || isRejected || isActive}
        />
      </Tooltip>

      <SellerRejectionModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        seller={record}
        onRejectSuccess={onReject}
      />

      <Tooltip title={isActive ? "Khóa cửa hàng" : "Mở khóa cửa hàng"}>
        <Popconfirm
          title={`Bạn có chắc muốn ${isActive ? "khóa" : "mở khóa"} cửa hàng này?`}
          onConfirm={handleLockToggle}
          okText="Có"
          cancelText="Hủy"
        >
          <Button
            icon={
              isActive ? (
                <StopOutlined style={{ color: "#faad14" }} />
              ) : (
                <PlayCircleOutlined style={{ color: "#1890ff" }} />
              )
            }
            type="text"
            size="small"
            disabled={isApproved || isRejected || isPending}
          />
        </Popconfirm>
      </Tooltip>
    </Space>
  );
};

export default SellerActions;
