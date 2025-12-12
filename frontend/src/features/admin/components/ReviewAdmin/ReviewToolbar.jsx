import React from "react";
import { Space, Button, Modal, message, Tooltip } from "antd";
import { EyeOutlined, EyeInvisibleOutlined, MessageOutlined, DeleteOutlined } from "@ant-design/icons";

const ReviewToolbar = ({ record, onViewDetail, onReply, onDelete, onToggleVisibility }) => {
  const handleDelete = (id) => {
    Modal.confirm({
      title: "Xác nhận xóa đánh giá?",
      content: "Hành động này không thể hoàn tác.",
      okType: "danger",
      onOk: async () => {
        try {
          await onDelete();
        } catch (err) {
          message.error("Lỗi khi xóa đánh giá!");
        }
      },
    });
  };

  const handleToggleVisibility = () => {
    Modal.confirm({
      title: record.is_hidden ? "Hiển thị đánh giá?" : "Ẩn đánh giá?",
      content: record.is_hidden
        ? "Đánh giá sẽ được hiển thị công khai trên sản phẩm."
        : "Đánh giá sẽ bị ẩn khỏi sản phẩm.",
      onOk: async () => {
        try {
          await onToggleVisibility();
        } catch (err) {
          message.error("Lỗi khi thay đổi trạng thái!");
        }
      },
    });
  };

  return (
    <Space>
      <Tooltip title="Xem chi tiết">
        <Button
          icon={<EyeOutlined />}
          onClick={onViewDetail}
          size="small"
        />
      </Tooltip>

      <Tooltip title="Trả lời đánh giá">
        <Button
          icon={<MessageOutlined />}
          onClick={onReply}
          size="small"
          type="primary"
        />
      </Tooltip>

      <Tooltip title={record.is_hidden ? "Hiển thị đánh giá" : "Ẩn đánh giá"} >
        <Button
          icon={record.is_hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={handleToggleVisibility}
          size="small"
          type={record.is_hidden ? "default" : "text"}
        />
      </Tooltip>

      <Tooltip title="Xóa đánh giá">
        <Button
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          size="small"
          danger
        />
      </Tooltip>
    </Space>
  );
};

export default ReviewToolbar;