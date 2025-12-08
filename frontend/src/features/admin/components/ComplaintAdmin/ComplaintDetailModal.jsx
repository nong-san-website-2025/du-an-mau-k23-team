import React from "react";
import { Modal, Descriptions, Image, Typography, Empty } from "antd";

const { Text } = Typography;

const ComplaintDetailModal = ({ visible, complaint, onClose }) => {
  if (!complaint) return null;

  // Tách media thành ảnh và video
  const images = complaint.media_urls?.filter(url => !url.match(/\.(mp4|webm|ogg)$/i)) || [];
  const videos = complaint.media_urls?.filter(url => url.match(/\.(mp4|webm|ogg)$/i)) || [];

  return (
    <Modal
      open={visible}
      title="Chi tiết khiếu nại"
      onCancel={onClose}
      footer={null}
      width={700}
      centered
    >
      <Descriptions bordered column={1} labelStyle={{ width: '150px', fontWeight: 'bold' }}>
        <Descriptions.Item label="Người dùng">{complaint.user_name}</Descriptions.Item>
        <Descriptions.Item label="Sản phẩm">{complaint.product_name}</Descriptions.Item>
        <Descriptions.Item label="Đơn giá">
          {Number(complaint.unit_price ?? complaint.product_price).toLocaleString("vi-VN")} VNĐ
        </Descriptions.Item>
        <Descriptions.Item label="Số lượng">{complaint.quantity ?? 1}</Descriptions.Item>
        <Descriptions.Item label="Lý do báo cáo">
            <Text type="danger">{complaint.reason}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
            {complaint.created_at ? new Date(complaint.created_at).toLocaleString("vi-VN") : ""}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 20 }}>
        <Text strong style={{ display: 'block', marginBottom: 10 }}>Hình ảnh & Video bằng chứng:</Text>
        
        {complaint.media_urls?.length > 0 ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Gallery Ảnh */}
            <Image.PreviewGroup>
              {images.map((url, idx) => (
                <Image 
                  key={`img-${idx}`} 
                  width={100} 
                  height={100} 
                  src={url} 
                  style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0' }} 
                />
              ))}
            </Image.PreviewGroup>

            {/* Video Player */}
            {videos.map((url, idx) => (
              <video 
                key={`vid-${idx}`} 
                src={url} 
                controls 
                style={{ width: 180, height: 100, borderRadius: 8, backgroundColor: '#000' }} 
              />
            ))}
          </div>
        ) : (
          <Empty description="Không có hình ảnh/video đính kèm" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </Modal>
  );
};

export default ComplaintDetailModal;