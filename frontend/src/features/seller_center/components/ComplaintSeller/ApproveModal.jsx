import React from "react";
import { Modal, Input, Typography, Descriptions } from "antd";
import { formatVND } from "../../../../utils/complaintHelpers";

const { Text } = Typography;

const ApproveModal = ({ 
  open, 
  onCancel, 
  onOk, 
  record, // Nhận trực tiếp record
  note,   // Nhận trực tiếp note
  setNote // Hàm set note
}) => {
  
  // Tính toán số tiền sẽ hoàn (Dựa trên Serializer mới: purchase_price * purchase_quantity)
  const refundAmount = record 
    ? (record.purchase_price || 0) * (record.purchase_quantity || 1) 
    : 0;

  return (
    <Modal
      title="Xác nhận Hoàn tiền"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Đồng ý hoàn tiền"
      okButtonProps={{ type: "primary" }} // Màu xanh mặc định thay vì danger
      cancelText="Hủy bỏ"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", padding: 12, borderRadius: 6 }}>
            <Text type="success">
                Hành động này sẽ chấp nhận khiếu nại và hoàn tiền về Ví cho khách hàng.
            </Text>
        </div>

        {record && (
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Sản phẩm">
                    {record.product_name}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng">
                    {record.purchase_quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Đơn giá mua">
                    {formatVND(record.purchase_price)}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền hoàn">
                    <Text strong type="danger" style={{ fontSize: 16 }}>
                        {formatVND(refundAmount)}
                    </Text>
                </Descriptions.Item>
            </Descriptions>
        )}

        <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Lời nhắn cho khách hàng (Tùy chọn):</div>
            <Input.TextArea
            rows={3}
            placeholder="Ví dụ: Shop đã kiểm tra và đồng ý hoàn tiền cho bạn..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            />
        </div>
      </div>
    </Modal>
  );
};

export default ApproveModal;