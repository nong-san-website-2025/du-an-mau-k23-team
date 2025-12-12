import React from "react";
import { Modal, Descriptions, Tag } from "antd";
import dayjs from "dayjs";

export default function PromotionDetailModal({ open, onCancel, detail }) {
  
  // Helper render loại voucher
  const renderType = () => {
      const isFreeship = detail.voucher_type === 'freeship' || detail.freeship_amount > 0 || detail.discount_type === 'freeship';
      return isFreeship 
        ? <Tag color="purple">Miễn phí vận chuyển</Tag> 
        : <Tag color="blue">Voucher Thường</Tag>;
  };

  // Helper render giá trị giảm
  const renderValue = () => {
      if (detail.freeship_amount > 0) return `${parseInt(detail.freeship_amount).toLocaleString()}đ (Freeship)`;
      if (detail.discount_percent > 0) return `${detail.discount_percent}% (Tối đa: ${parseInt(detail.max_discount_amount || 0).toLocaleString()}đ)`;
      return `${parseInt(detail.discount_amount || 0).toLocaleString()}đ`;
  };

  return (
    <Modal
      title={`Chi tiết voucher: ${detail?.title ?? detail?.code ?? ""}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      {detail ? (
        <Descriptions bordered column={1} labelStyle={{ width: '150px', fontWeight: 'bold' }}>
          <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="Mã Voucher">{detail.code}</Descriptions.Item>
          <Descriptions.Item label="Tên chương trình">{detail.title || detail.name}</Descriptions.Item>
          
          <Descriptions.Item label="Loại Voucher">
             {renderType()}
          </Descriptions.Item>
          
          <Descriptions.Item label="Giá trị giảm">
             <span className="text-red-500 font-bold">{renderValue()}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Đơn tối thiểu">
             {parseInt(detail.min_order_value || 0).toLocaleString()}đ
          </Descriptions.Item>

          <Descriptions.Item label="Số lượng">
             {detail.issued_count} / {detail.total_quantity || 'Không giới hạn'}
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian">
            {detail.start ? dayjs(detail.start).format("HH:mm DD/MM/YYYY") : "--"} 
            {'  ➔  '} 
            {detail.end ? dayjs(detail.end).format("HH:mm DD/MM/YYYY") : "--"}
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái">
            {detail.active ? <Tag color="success">Đang hoạt động</Tag> : <Tag color="error">Đã tắt</Tag>}
          </Descriptions.Item>
          
          <Descriptions.Item label="Mô tả">
            {detail.description || "Không có mô tả"}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <div className="text-center py-4">Đang tải thông tin...</div>
      )}
    </Modal>
  );
}