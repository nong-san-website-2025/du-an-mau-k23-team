import React from "react";
import { Modal, Card, Avatar, Rate, Divider, Space, Tag, Typography, Button } from "antd";
import { UserOutlined, ShopOutlined, MessageOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ReviewDetailModal = ({ visible, review, onClose, onReply }) => {
  if (!review) return null;

  return (
    <Modal
      open={visible}
      title="Chi tiết đánh giá"
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="reply"
          type="primary"
          icon={<MessageOutlined />}
          onClick={() => {
            onClose();
            onReply(review);
          }}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Trả lời
        </Button>
      ]}
      width={700}
    >
      <div style={{ padding: "20px 0" }}>
        {/* Thông tin người dùng và sản phẩm */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div>
                <Text strong>{review.user_name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {new Date(review.created_at).toLocaleString('vi-VN')}
                </Text>
              </div>
            </Space>

            <Divider style={{ margin: "8px 0" }} />

            <Space>
              <Avatar icon={<ShopOutlined />} />
              <div>
                <Text strong>{review.product_name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Cửa hàng: {review.seller_store_name}
                </Text>
              </div>
            </Space>
          </Space>
        </Card>

        {/* Nội dung đánh giá */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>Đánh giá: </Text>
              <Rate disabled value={review.rating} style={{ marginLeft: 8 }} />
              <Text style={{ marginLeft: 8 }}>{review.rating}/5 sao</Text>
            </div>

            <div>
              <Text strong>Nội dung đánh giá:</Text>
              <div style={{
                marginTop: 8,
                padding: 12,
                backgroundColor: '#f9f9f9',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                minHeight: 60
              }}>
                {review.comment || "Không có nội dung"}
              </div>
            </div>
          </Space>
        </Card>

        {/* Trạng thái */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            <Text strong>Trạng thái:</Text>
            <Space>
              <Tag color={review.is_hidden ? "red" : "green"}>
                {review.is_hidden ? "Đã ẩn" : "Hiển thị"}
              </Tag>
              <Tag color={(review.replies && review.replies.length > 0) ? "blue" : "orange"}>
                {(review.replies && review.replies.length > 0) ? `Đã trả lời (${review.replies.length})` : "Chưa trả lời"}
              </Tag>
            </Space>
          </Space>
        </Card>

        {/* Các phản hồi */}
        {review.replies && review.replies.length > 0 && (
          <Card size="small" title="Các phản hồi" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              {review.replies.map((reply, index) => (
                <div key={reply.id || index} style={{
                  padding: 12,
                  backgroundColor: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6,
                  marginBottom: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong style={{ color: '#52c41a' }}>
                      {reply.user_name || "Người bán"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(reply.created_at).toLocaleString('vi-VN')}
                    </Text>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {reply.reply_text}
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* Thông tin bổ sung */}
        <Card size="small" title="Thông tin bổ sung">
          <Space direction="vertical" size={8}>
            <Text>ID đánh giá: <Text code>{review.id}</Text></Text>
            <Text>Thời gian tạo: {new Date(review.created_at).toLocaleString('vi-VN')}</Text>
            {review.updated_at && (
              <Text>Cập nhật lần cuối: {new Date(review.updated_at).toLocaleString('vi-VN')}</Text>
            )}
          </Space>
        </Card>
      </div>
    </Modal>
  );
};

export default ReviewDetailModal;