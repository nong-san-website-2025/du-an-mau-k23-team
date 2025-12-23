// components/ComplaintSeller/ApproveModal.jsx
import React from "react";
import { Modal, Input, Typography, Descriptions, Checkbox } from "antd"; // Import Checkbox
import { formatVND } from "../../../../utils/complaintHelpers";

const { Text } = Typography;

const ApproveModal = ({ 
  open, 
  onCancel, 
  onOk, 
  record, 
  note, 
  setNote,
  // [MỚI] Nhận thêm props
  isReturnRequired, 
  setIsReturnRequired 
}) => {
  
  const refundAmount = record 
    ? (record.purchase_price || 0) * (record.purchase_quantity || 1) 
    : 0;

  return (
    <Modal
      title="Xác nhận xử lý khiếu nại"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Xác nhận"
      okButtonProps={{ type: "primary" }}
      cancelText="Hủy bỏ"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* [MỚI] Checkbox lựa chọn quan trọng */}
        <div style={{ background: "#e6f7ff", border: "1px solid #91d5ff", padding: 12, borderRadius: 6 }}>
            <Checkbox 
                checked={isReturnRequired} 
                onChange={(e) => setIsReturnRequired(e.target.checked)}
            >
                <Text strong>Yêu cầu khách gửi trả hàng về kho?</Text>
            </Checkbox>
            <div style={{ marginTop: 8, fontSize: 13, color: '#595959', paddingLeft: 24 }}>
                {isReturnRequired ? (
                    <span>👉 Khách phải nhập mã vận đơn gửi hàng về. Sau khi Shop nhận được hàng, tiền mới được hoàn.</span>
                ) : (
                    <span style={{color: '#faad14'}}>👉 Tiền sẽ được hoàn vào Ví khách hàng <b>NGAY LẬP TỨC</b>. Shop không thu hồi sản phẩm.</span>
                )}
            </div>
        </div>

        {record && (
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Sản phẩm">{record.product_name}</Descriptions.Item>
                <Descriptions.Item label="Tổng tiền hoàn">
                    <Text strong type="danger">{formatVND(refundAmount)}</Text>
                </Descriptions.Item>
            </Descriptions>
        )}

        <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Lời nhắn cho khách hàng:</div>
            <Input.TextArea
                rows={2}
                placeholder="Ví dụ: Shop đồng ý..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
        </div>
      </div>
    </Modal>
  );
};

export default ApproveModal;