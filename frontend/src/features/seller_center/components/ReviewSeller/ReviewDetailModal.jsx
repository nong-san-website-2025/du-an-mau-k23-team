import React from "react";
import { Modal, Avatar, Rate, Divider, Space, Tag, Typography, Button, Descriptions, Timeline, theme } from "antd";
import { UserOutlined, ShopOutlined, MessageOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

const ReviewDetailModal = ({ visible, review, onClose, onReply }) => {
  const { token } = theme.useToken();

  if (!review) return null;

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
        <Avatar size={54} icon={<UserOutlined />} src={review.user_avatar} />
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