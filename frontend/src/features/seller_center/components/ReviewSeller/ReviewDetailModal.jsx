import React from "react";
import { Modal, Avatar, Rate, Divider, Space, Tag, Typography, Button, Descriptions, Timeline, theme, Image } from "antd";
import { UserOutlined, ShopOutlined, MessageOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

// Helper to get full image URL
const getImageUrl = (imgData) => {
  if (!imgData) return "";
  // Lấy đường dẫn từ object (.image, .url) hoặc trực tiếp là string
  let src = typeof imgData === 'string' ? imgData : (imgData.image || imgData.url);
  
  if (!src || typeof src !== 'string') return "";
  
  // Nếu đã là URL tuyệt đối thì trả về luôn
  if (src.startsWith("http")) return src;

  // Xử lý URL tương đối
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const BASE_URL = API_URL.replace(/\/api\/?$/, "");
  const cleanSrc = src.startsWith("/") ? src : `/${src}`;
  
  return `${BASE_URL}${cleanSrc}`;
};

const ReviewDetailModal = ({ visible, review, onClose, onReply }) => {
  const { token } = theme.useToken();

  if (!review) return null;
  
  // Debug log để kiểm tra dữ liệu trong console (nếu cần)
  console.log("Review Detail Data:", review);

  return (
    <Modal
      open={visible}
      title={<Title level={4} style={{ margin: 0 }}>Chi tiết đánh giá #{review.id}</Title>}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>Đóng</Button>,
        <Button
          key="reply"
          type="primary"
          icon={<MessageOutlined />}
          onClick={() => { onClose(); onReply(review); }}
        >
          Viết phản hồi
        </Button>
      ]}
      width={700}
      centered
    >
      {/* Product & Status Info */}
      <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
        <Descriptions.Item label="Sản phẩm" span={2}>
           <Text strong>{review.product_name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Thời gian">
           {new Date(review.created_at).toLocaleString('vi-VN')}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
           <Space>
             <Tag color={review.is_hidden ? "red" : "green"}>{review.is_hidden ? "Đã ẩn" : "Hiển thị"}</Tag>
             <Tag color={(review.replies?.length > 0) ? "blue" : "orange"}>
               {(review.replies?.length > 0) ? "Đã trả lời" : "Chưa trả lời"}
             </Tag>
           </Space>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" style={{ borderColor: token.colorBorderSecondary }}>Nội dung đánh giá</Divider>

      {/* User Review Content */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Avatar size={54} icon={<UserOutlined />} src={getImageUrl(review.user_avatar)} />
        <div style={{ flex: 1 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 16 }}>{review.user_name}</Text>
              <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
           </div>
           <div style={{ 
             marginTop: 12, 
             padding: 16, 
             background: '#f5f5f5', 
             borderRadius: 8, 
             position: 'relative' 
           }}>
              <Paragraph style={{ margin: 0, fontSize: 15 }}>{review.comment || "Không có nội dung văn bản"}</Paragraph>
           </div>
           
           {/* Review Images - Hiển thị ảnh đánh giá */}
           {(review.images && review.images.length > 0) || (review.review_images && review.review_images.length > 0) ? (
             <div style={{ marginTop: 16 }}>
               <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Hình ảnh đính kèm:</Text>
               <Image.PreviewGroup>
                 <Space size={8} wrap>
                   {(review.images || review.review_images).map((img, idx) => (
                     <Image
                       key={idx}
                       width={100}
                       height={100}
                       src={getImageUrl(img)}
                       style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #d9d9d9", cursor: 'pointer' }}
                       alt={`Review image ${idx + 1}`}
                     />
                   ))}
                 </Space>
               </Image.PreviewGroup>
             </div>
           ) : null}
        </div>
      </div>

      {/* Replies Timeline */}
      {review.replies && review.replies.length > 0 && (
        <>
          <Divider orientation="left" style={{ borderColor: token.colorBorderSecondary }}>Lịch sử phản hồi</Divider>
          <div style={{ paddingLeft: 24 }}>
            <Timeline>
              {review.replies.map((reply, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={<ShopOutlined style={{ fontSize: 16, color: token.colorPrimary }} />}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                     <Text strong style={{ color: token.colorPrimary }}>{reply.user_name || "Cửa hàng"}</Text>
                     <Text type="secondary" style={{ fontSize: 12 }}><ClockCircleOutlined /> {new Date(reply.created_at).toLocaleString('vi-VN')}</Text>
                  </div>
                  <Paragraph style={{ color: token.colorTextSecondary }}>{reply.reply_text}</Paragraph>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ReviewDetailModal;