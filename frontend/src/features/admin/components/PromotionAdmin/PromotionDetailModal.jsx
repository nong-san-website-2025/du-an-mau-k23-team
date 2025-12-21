import React from "react";
import { Modal, Descriptions, Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export default function PromotionDetailModal({ open, onCancel, detail }) {
  
  if (!detail) return null;

  // 1. Helper render loại voucher (Kiểm tra kỹ các trường)
  const renderType = () => {
      const isFreeship = 
        detail.voucher_type === 'freeship' || 
        (detail.freeship_amount && detail.freeship_amount > 0) || 
        detail.discount_type === 'freeship';
        
      return isFreeship 
        ? <Tag color="purple" style={{ fontSize: 13, padding: '2px 10px' }}>Miễn phí vận chuyển</Tag> 
        : <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>Voucher Thường</Tag>;
  };

  // 2. Helper render giá trị giảm (Format chuẩn VN)
  const formatMoney = (amount) => {
      return parseInt(amount || 0).toLocaleString('vi-VN');
  };

  const renderValue = () => {
      if (detail.freeship_amount > 0) return `${formatMoney(detail.freeship_amount)}đ (Freeship)`;
      if (detail.discount_percent > 0) return `${detail.discount_percent}% (Tối đa: ${formatMoney(detail.max_discount_amount)}đ)`;
      return `${formatMoney(detail.discount_amount)}đ`;
  };

  // 3. Helper lấy thời gian an toàn (API có thể trả start hoặc start_at)
  const startTime = detail.start_at || detail.start;
  const endTime = detail.end_at || detail.end;

  return (
    <Modal
      title={<span style={{ fontSize: 18, color: '#1890ff' }}>Chi tiết voucher: {detail.code}</span>}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
    >
        <Descriptions 
            bordered 
            column={1} 
            labelStyle={{ width: '180px', fontWeight: '600', backgroundColor: '#fafafa' }}
            contentStyle={{ backgroundColor: '#fff' }}
            size="small"
        >
          <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
          
          <Descriptions.Item label="Mã Voucher">
              <Text copyable strong style={{ color: '#1890ff' }}>{detail.code}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Tên chương trình">
              {detail.title || detail.name || <Text type="secondary" italic>Chưa đặt tên</Text>}
          </Descriptions.Item>
          
          <Descriptions.Item label="Loại Voucher">
              {renderType()}
          </Descriptions.Item>
          
          <Descriptions.Item label="Giá trị giảm">
              <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{renderValue()}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Đơn tối thiểu">
              {formatMoney(detail.min_order_value)}đ
          </Descriptions.Item>

          <Descriptions.Item label="Số lượng sử dụng">
              <span style={{ fontWeight: 600 }}>{detail.used_quantity || detail.issued_count || 0}</span> 
              <span style={{ color: '#999', margin: '0 4px' }}>/</span> 
              <span>{detail.total_quantity || 'Không giới hạn'}</span>
          </Descriptions.Item>
          
          <Descriptions.Item label="Giới hạn mỗi người">
              {detail.per_user_quantity || 1} mã
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian áp dụng">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>
                    <span style={{ color: '#888', minWidth: 60, display: 'inline-block' }}>Bắt đầu:</span> 
                    <span style={{ fontWeight: 500 }}>
                        {startTime ? dayjs(startTime).format("HH:mm - DD/MM/YYYY") : "--"}
                    </span>
                </div>
                <div>
                    <span style={{ color: '#888', minWidth: 60, display: 'inline-block' }}>Kết thúc:</span> 
                    <span style={{ fontWeight: 500 }}>
                        {endTime ? dayjs(endTime).format("HH:mm - DD/MM/YYYY") : "--"}
                    </span>
                </div>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái">
            {detail.active 
                ? <Tag color="success">Đang hoạt động</Tag> 
                : <Tag color="error">Đã tắt</Tag>
            }
          </Descriptions.Item>
          
          <Descriptions.Item label="Mô tả">
            {detail.description || <Text type="secondary" italic>Không có mô tả</Text>}
          </Descriptions.Item>
        </Descriptions>
    </Modal>
  );
}