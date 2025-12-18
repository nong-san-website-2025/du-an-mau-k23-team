import React from "react";
import { Modal, Tag, Typography, Divider, Image } from "antd";
import moment from "moment";
import { formatVND, isImageUrl } from "../../../../utils/complaintHelpers";

const { Title, Text } = Typography;

const DetailModal = ({ visible, onCancel, complaint }) => {
  if (!complaint) return null;

  // Cập nhật Map status mới
  const getStatusConfig = (status) => {
    const config = {
      pending: { color: "orange", text: "Chờ Shop phản hồi" },
      negotiating: { color: "purple", text: "Đang thương lượng (Shop từ chối)" },
      admin_review: { color: "blue", text: "Đang chờ Sàn phán quyết" },
      resolved_refund: { color: "green", text: "Thành công (Đã hoàn tiền)" },
      resolved_reject: { color: "red", text: "Đã đóng (Không hoàn tiền)" },
      cancelled: { color: "default", text: "Đã hủy" },
    };
    return config[status] || { color: "default", text: status };
  };

  const { color: statusColor, text: statusText } = getStatusConfig(complaint.status);

  // Serializer mới trả về 'media' là danh sách object {id, file}
  // Cần map ra url
  const mediaList = complaint.media?.map(m => m.file) || [];

  return (
    <Modal
      title={<Title level={4}>Chi tiết khiếu nại #{complaint.id}</Title>}
      open={visible}
      footer={null}
      onCancel={onCancel}
      width={760}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Cột Trái */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <InfoGroup title="Thông tin người mua">
            <InfoRow label="Họ tên" value={complaint.created_by_name} />
            <InfoRow label="Email" value={complaint.created_by_email} />
          </InfoGroup>

          <InfoGroup title="Sản phẩm yêu cầu">
            <InfoRow label="Sản phẩm" value={complaint.product_name} />
            <InfoRow label="Mã đơn" value={`#${complaint.order_id}`} />
            {complaint.order_code && <InfoRow label="Vận đơn" value={complaint.order_code} />}
            <InfoRow label="Số lượng mua" value={complaint.purchase_quantity} />
            <InfoRow 
                label="Giá mua" 
                value={formatVND(complaint.purchase_price)} 
            />
            <Divider style={{margin: '8px 0'}}/>
            <InfoRow 
                label="Tổng hoàn dự kiến" 
                value={<Text type="danger" strong>{formatVND(complaint.purchase_price * complaint.purchase_quantity)}</Text>} 
            />
          </InfoGroup>
        </div>

        {/* Cột Phải */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <InfoGroup title="Trạng thái xử lý">
            <InfoRow label="Hiện tại">
              <Tag color={statusColor}>{statusText}</Tag>
            </InfoRow>
            <InfoRow label="Ngày tạo" value={moment(complaint.created_at).format("HH:mm DD/MM/YYYY")} />
          </InfoGroup>

          <InfoGroup title="Nội dung khiếu nại">
            <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 6, minHeight: 60 }}>
                {complaint.reason}
            </div>
          </InfoGroup>

          {/* Hiển thị phản hồi của Shop nếu có */}
          {complaint.seller_response && (
             <InfoGroup title="Phản hồi của Shop">
                <div style={{ background: '#fff7e6', padding: 10, borderRadius: 6, border: '1px solid #ffd591' }}>
                    {complaint.seller_response}
                </div>
             </InfoGroup>
          )}

           {/* Hiển thị phán quyết của Admin nếu có */}
           {complaint.admin_notes && (
             <InfoGroup title="Phán quyết của Sàn">
                <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 6, border: '1px solid #91d5ff' }}>
                    {complaint.admin_notes}
                </div>
             </InfoGroup>
          )}
        </div>
      </div>

      {/* Minh chứng */}
      {mediaList.length > 0 && (
        <>
          <Divider orientation="left">Hình ảnh / Video bằng chứng</Divider>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {mediaList.map((url, idx) => (
              <Image
                key={idx}
                src={url}
                width={100}
                height={100}
                style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
              />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
};

// Helper Components (Giữ nguyên như cũ)
const InfoGroup = ({ title, children }) => (
  <div style={{ marginBottom: 12 }}>
    <Text strong style={{ display: 'block', marginBottom: 8 }}>{title}</Text>
    {children}
  </div>
);

const InfoRow = ({ label, value, children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
    <Text type="secondary">{label}:</Text>
    <div>{children || <Text>{value || "—"}</Text>}</div>
  </div>
);

export default DetailModal;