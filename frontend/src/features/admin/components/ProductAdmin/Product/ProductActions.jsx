import React from "react";
import { Button, Tooltip, Popconfirm, message } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const ProductActions = ({ record, onApprove, onReject, onToggleBan }) => {
  const isApproved = record.status === "approved";
  const isRejected = record.status === "rejected";
  const isPending = record.status === "pending";
  const isBanned = record.status === "banned";

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        justifyContent: "center",
      }}
      onClick={(e) => e.stopPropagation()} // ✅ chặn click lan lên row
    >
      {/* ✅ Duyệt sản phẩm */}
      <Tooltip title="Duyệt sản phẩm">
        <Popconfirm
          title="Bạn có chắc muốn duyệt sản phẩm này?"
          okText="Duyệt"
          cancelText="Hủy"
          onConfirm={(e) => {
            e?.stopPropagation();
            onApprove(record);
            message.success("Đã duyệt sản phẩm!");
          }}
          onCancel={(e) => e?.stopPropagation()}
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            disabled={isApproved || isRejected || isBanned}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </Tooltip>

      {/* ❌ Từ chối sản phẩm */}
      <Tooltip title="Từ chối sản phẩm">
        <Popconfirm
          title="Bạn có chắc muốn từ chối sản phẩm này?"
          okText="Từ chối"
          cancelText="Hủy"
          onConfirm={(e) => {
            e?.stopPropagation();
            onReject(record);
            message.info("Đã từ chối sản phẩm.");
          }}
          onCancel={(e) => e?.stopPropagation()}
        >
          <Button
            danger
            icon={<CloseOutlined />}
            size="small"
            disabled={isApproved || isRejected || isBanned}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </Tooltip>

      {/* 🚫 / 🔓 Khoá / Mở khoá sản phẩm */}
      {isBanned ? (
        <Tooltip title="Mở khoá sản phẩm">
          <Popconfirm
            title="Bạn có chắc muốn mở khoá sản phẩm này?"
            okText="Mở khoá"
            cancelText="Hủy"
            onConfirm={(e) => {
              e?.stopPropagation();
              onToggleBan(record);
              message.success("Đã mở khoá sản phẩm!");
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              icon={<UnlockOutlined style={{ color: "#52c41a" }} />}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Tooltip>
      ) : (
        <Tooltip title="Khoá sản phẩm">
          <Popconfirm
            title="Bạn có chắc muốn khoá sản phẩm này?"
            okText="Khoá"
            cancelText="Hủy"
            onConfirm={(e) => {
              e?.stopPropagation();
              onToggleBan(record);
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              icon={<StopOutlined style={{ color: "#ff4d4f" }} />}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Tooltip>
      )}
    </motion.div>
  );
};

export default ProductActions;
