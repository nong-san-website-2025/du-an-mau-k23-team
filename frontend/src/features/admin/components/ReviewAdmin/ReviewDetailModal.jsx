// src/components/ReviewAdmin/ReviewDetailModal.jsx
import React from "react";
import { Modal, Descriptions, Rate, Timeline, Typography, Avatar, Divider, Space, Alert, Image } from "antd";
import { UserOutlined, ClockCircleOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import StatusTag from "../../../../components/StatusTag";

const { Text, Title } = Typography;

// Helper to get full image URL
const getImageUrl = (imgData) => {
  if (!imgData) return "";
  let src = typeof imgData === 'string' ? imgData : (imgData.image || imgData.url);
  if (!src || typeof src !== 'string') return "";
  if (src.startsWith("http")) return src;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const BASE_URL = API_URL.replace(/\/api\/?$/, "");
  const cleanSrc = src.startsWith("/") ? src : `/${src}`;
  return `${BASE_URL}${cleanSrc}`;
};

const ReviewDetailModal = ({ visible, review, onClose }) => {
  if (!review) return null;

  const getStatusInfo = (r) => {
     if (r.is_hidden) return { status: 'locked', label: 'Đã ẩn' };
     if (r.replies?.length > 0) return { status: 'approved', label: 'Đã phản hồi' };
     return { status: 'pending', label: 'Chờ phản hồi' };
  };

  const statusInfo = getStatusInfo(review);

  return (
    <Modal
      open={visible}
      title={<Title level={4} style={{ margin: 0 }}>Chi tiết đánh giá #{review.id}</Title>}
      onCancel={onClose}
      footer={null}
      width={750}
      centered
    >
      {/* 1. Thêm Alert cảnh báo nếu review đang ẩn */}
      {review.is_hidden && (
        <Alert
          message="Đánh giá này đang bị ẩn"
          description="Thông tin sản phẩm sẽ không hiển thị khi đánh giá ở trạng thái ẩn."
          type="warning"
          showIcon
          icon={<EyeInvisibleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Descriptions title="Thông tin chung" bordered size="small" column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Người dùng">
          <Space>
             <Avatar size="small" icon={<UserOutlined />} />
             <Text strong>{review.user_name}</Text>
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item label="Thời gian">
            {new Date(review.created_at).toLocaleString('vi-VN')}
        </Descriptions.Item>

        {/* 2. CHỈNH SỬA Ở ĐÂY: Chỉ hiện thông tin sản phẩm nếu review KHÔNG bị ẩn */}
        {!review.is_hidden && (
            <Descriptions.Item label="Sản phẩm" span={2}>
                <Text type="success" strong>{review.product_name}</Text> 
                <Text type="secondary"> (Shop: {review.seller_store_name})</Text>
            </Descriptions.Item>
        )}

        <Descriptions.Item label="Xếp hạng">
           <Rate disabled allowHalf value={review.rating} style={{ fontSize: 16 }} /> 
           <Text strong style={{ marginLeft: 8 }}>{review.rating}/5</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Trạng thái">
           <StatusTag status={statusInfo.status} label={statusInfo.label} />
        </Descriptions.Item>
      </Descriptions>

      <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
         <Title level={5} style={{ fontSize: 14, marginTop: 0 }}>Nội dung đánh giá:</Title>
         <Text style={{ fontSize: 15, color: '#262626' }}>
            "{review.comment || "Khách hàng không để lại bình luận text."}"
         </Text>

         {/* Review Images */}
         {((review.images && review.images.length > 0) || (review.review_images && review.review_images.length > 0)) && (
           <div style={{ marginTop: 16 }}>
             <Image.PreviewGroup>
               <Space size={8} wrap>
                 {(review.images || review.review_images).map((img, idx) => (
                   <Image
                     key={idx}
                     width={80}
                     height={80}
                     src={getImageUrl(img)}
                     style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #d9d9d9", cursor: 'pointer' }}
                     alt={`Review image ${idx + 1}`}
                   />
                 ))}
               </Space>
             </Image.PreviewGroup>
           </div>
         )}
      </div>

      {review.replies && review.replies.length > 0 && (
        <>
          <Divider orientation="left" style={{ borderColor: '#d9d9d9' }}>Lịch sử phản hồi</Divider>
          <Timeline style={{ marginTop: 20 }}>
            {review.replies.map((reply, index) => (
              <Timeline.Item key={index} color="green" dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <Space>
                      <Text strong>{reply.user?.username || "Quản trị viên"}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(reply.created_at).toLocaleString('vi-VN')}
                      </Text>
                   </Space>
                   <div style={{ marginTop: 8, padding: '10px 15px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                      {reply.reply_text}
                   </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      )}
    </Modal>
  );
};

export default ReviewDetailModal;