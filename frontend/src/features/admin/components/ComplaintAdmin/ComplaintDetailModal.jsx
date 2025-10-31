import React from "react";
import { Modal } from "antd";

const ComplaintDetailModal = ({ visible, complaint, onClose }) => {
  if (!complaint) return null;

  return (
    <Modal
      open={visible}
      title="Chi tiết khiếu nại"
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <p><b>Người dùng:</b> {complaint.user_name}</p>
      <p><b>Sản phẩm:</b> {complaint.product_name}</p>
      <p><b>Đơn giá:</b> {complaint.unit_price ?? complaint.product_price}</p>
      <p><b>Số lượng:</b> {complaint.quantity ?? 1}</p>
      <p><b>Lý do:</b> {complaint.reason}</p>
      <p><b>Trạng thái:</b> {complaint.status}</p>
      <p><b>Ngày tạo:</b> {complaint.created_at}</p>

      <div>
        <b>Hình ảnh/Video minh họa:</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {Array.isArray(complaint.media_urls) && complaint.media_urls.length > 0 ? (
            complaint.media_urls.map((url, idx) => 
              url.match(/\.(mp4|webm|ogg)$/i) ? (
                <video key={idx} src={url} controls style={{ width: 220, height: 120 }} />
              ) : (
                <img key={idx} src={url} alt="media" style={{ maxWidth: 120, maxHeight: 90, borderRadius: 4 }} />
              )
            )
          ) : <span>Không có</span>}
        </div>
      </div>
    </Modal>
  );
};

export default ComplaintDetailModal;
