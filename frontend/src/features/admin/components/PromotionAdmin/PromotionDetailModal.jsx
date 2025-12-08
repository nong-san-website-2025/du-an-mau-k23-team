// src/features/admin/promotions/components/PromotionDetailModal.jsx
import React from "react";
import { Modal, Descriptions } from "antd";
import dayjs from "dayjs";

export default function PromotionDetailModal({ open, onCancel, detail }) {
  return (
    <Modal
      title={`Chi tiết voucher: ${detail?.title ?? ""}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      {detail ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="Mã">{detail.code}</Descriptions.Item>
          <Descriptions.Item label="Tên">{detail.title}</Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            {detail.description || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Bắt đầu">
            {detail.start_at
              ? dayjs(detail.start_at).format("DD/MM/YYYY HH:mm")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Kết thúc">
            {detail.end_at
              ? dayjs(detail.end_at).format("DD/MM/YYYY HH:mm")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {detail.active ? "Hoạt động" : "Tắt"}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        "Đang tải..."
      )}
    </Modal>
  );
}
