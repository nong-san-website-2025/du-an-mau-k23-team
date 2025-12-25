import React from "react";
import { Card, Avatar, Rate, Space, Typography, Tag, Button, Tooltip, Divider, theme, Image } from "antd";
import { UserOutlined, MessageOutlined, EyeOutlined, ClockCircleOutlined, ShopOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

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

const ReviewCard = ({ review, onReply, onViewDetail }) => {
  const { token } = theme.useToken();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const hasReplies = review.replies && review.replies.length > 0;
  const isHidden = review.is_hidden;

  return (
    <Card
      bordered={false}
      hoverable
      style={{
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        opacity: isHidden ? 0.6 : 1,
      }}
      bodyStyle={{ padding: 20 }}
    >
      {/* Header: User Info & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space align="start">
          <Avatar 
            size={48} 
            src={getImageUrl(review.user_avatar)} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary }} 
          />
          <div>
            <Text strong style={{ fontSize: 16, display: 'block' }}>{review.user_name}</Text>
            <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 12 }}>
              <ClockCircleOutlined />
              <span>{formatDate(review.created_at)}</span>
              <Divider type="vertical" />
              <span>{review.product_name}</span>
            </Space>
          </div>
        </Space>

        <Space>
           {isHidden && <Tag color="error">Đã ẩn</Tag>}
           <Button type="text" icon={<EyeOutlined />} onClick={() => onViewDetail(review)}>Chi tiết</Button>
           <Button type="primary" ghost icon={<MessageOutlined />} onClick={() => onReply(review)}>
             {hasReplies ? 'Phản hồi thêm' : 'Trả lời'}
           </Button>
        </Space>
      </div>

      {/* Rating & Content */}
      <div style={{ paddingLeft: 60 }}>
        <div style={{ marginBottom: 8 }}>
          <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
          <Text strong style={{ marginLeft: 8, color: review.rating >= 4 ? token.colorSuccess : token.colorWarning }}>
            {review.rating >= 4 ? 'Tuyệt vời' : review.rating === 3 ? 'Bình thường' : 'Tệ'}
          </Text>
        </div>
        
        <Paragraph 
          style={{ fontSize: 15, color: token.colorText }}
          ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
        >
          {review.comment || <Text type="secondary" italic>Khách hàng không để lại bình luận văn bản.</Text>}
        </Paragraph>

        {/* Review Images */}
        {(review.images && review.images.length > 0) || (review.review_images && review.review_images.length > 0) ? (
          <div style={{ marginBottom: 16 }}>
            <Image.PreviewGroup>
              <Space size={8} wrap>
                {(review.images || review.review_images).map((img, idx) => (
                  <Image
                    key={idx}
                    width={64}
                    height={64}
                    src={getImageUrl(img)}
                    style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #f0f0f0" }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        ) : null}

        {/* Latest Reply Section - Threaded View Style */}
        {hasReplies && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: token.colorFillAlter, 
            borderRadius: 8,
            borderLeft: `4px solid ${token.colorPrimary}`
          }}>
            <Space align="center" style={{ marginBottom: 8 }}>
               <ShopOutlined style={{ color: token.colorPrimary }} />
               <Text strong style={{ color: token.colorPrimary }}>Phản hồi của Shop</Text>
               <Text type="secondary" style={{ fontSize: 12 }}>• {formatDate(review.replies[review.replies.length - 1].created_at)}</Text>
            </Space>
            <Paragraph style={{ margin: 0, color: token.colorTextSecondary }} ellipsis={{ rows: 2 }}>
              {review.replies[review.replies.length - 1].reply_text}
            </Paragraph>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReviewCard;