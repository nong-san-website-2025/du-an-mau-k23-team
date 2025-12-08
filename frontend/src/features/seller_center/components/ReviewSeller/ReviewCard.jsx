import React from "react";
import { Card, Avatar, Rate, Space, Typography, Tag, Button, Tooltip } from "antd";
import { UserOutlined, MessageOutlined, EyeOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

const ReviewCard = ({ review, onReply, onViewDetail }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#52c41a';
    if (rating >= 3) return '#faad14';
    return '#ff4d4f';
  };

  const hasReplies = review.replies && review.replies.length > 0;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      hoverable
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Header với thông tin user và thời gian */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Avatar
              icon={<UserOutlined />}
              src={review.user_avatar}
              size="small"
              style={{ marginRight: 8 }}
            />
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: '14px' }}>{review.user_name}</Text>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                <ClockCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c', marginRight: 4 }} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatDate(review.created_at)}
                </Text>
              </div>
            </div>
          </div>

          {/* Rating và sản phẩm */}
          <div style={{ marginBottom: 12 }}>
            <Space direction="vertical" size={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Rate
                  disabled
                  value={review.rating}
                  style={{ fontSize: '14px' }}
                />
                <Text style={{ color: getRatingColor(review.rating), fontWeight: 'bold' }}>
                  {review.rating}/5
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Sản phẩm: <Text strong>{review.product_name}</Text>
              </Text>
            </Space>
          </div>

          {/* Nội dung đánh giá */}
          <div style={{ marginBottom: 12 }}>
            <Paragraph
              ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
              style={{
                margin: 0,
                padding: 8,
                backgroundColor: '#f9f9f9',
                borderRadius: 4,
                fontSize: '14px'
              }}
            >
              {review.comment || "Không có nội dung đánh giá"}
            </Paragraph>
          </div>

          {/* Tags trạng thái */}
          <div style={{ marginBottom: 12 }}>
            <Space size={4}>
              <Tag color={review.is_hidden ? "red" : "green"} size="small">
                {review.is_hidden ? "Đã ẩn" : "Hiển thị"}
              </Tag>
              <Tag color={hasReplies ? "blue" : "orange"} size="small">
                {hasReplies ? `Đã trả lời (${review.replies.length})` : "Chưa trả lời"}
              </Tag>
            </Space>
          </div>

          {/* Hiển thị reply gần nhất nếu có */}
          {hasReplies && (
            <div style={{
              padding: 8,
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              marginBottom: 12
            }}>
              <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>
                Phản hồi gần nhất:
              </Text>
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: '#666'
                }}
              >
                {review.replies[review.replies.length - 1].reply_text}
              </Paragraph>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ marginLeft: 16 }}>
          <Space direction="vertical">
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => onViewDetail(review)}
              />
            </Tooltip>
            <Tooltip title="Trả lời đánh giá">
              <Button
                icon={<MessageOutlined />}
                size="small"
                type="primary"
                onClick={() => onReply(review)}
              />
            </Tooltip>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default ReviewCard;