// src/components/ProductDetail/ReviewsSection.jsx
import React, { useMemo } from "react";
import { 
  Card, 
  Button, 
  Input, 
  Rate, 
  List, 
  Space, 
  Typography, 
  Avatar, 
  Divider, 
  Empty, 
  Tag,
  Alert // Thêm Alert để hiện thông báo
} from "antd";
import { UserOutlined, SendOutlined, ShopOutlined, CheckCircleFilled, ShoppingCartOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text, Title } = Typography;

const ReviewsSection = ({
  user,
  reviews,
  myReview,
  newComment,
  newRating,
  hasPurchased, // <--- PROP MỚI: true nếu đã mua, false nếu chưa
  onNewCommentChange,
  onNewRatingChange,
  onSubmitReview,
}) => {
  
  const visibleReviews = useMemo(() => {
    const list = reviews ? reviews.filter((r) => !r.is_hidden) : [];
    if (myReview) {
      return list.filter(r => r.id !== myReview.id);
    }
    return list;
  }, [reviews, myReview]);

  // Helper render reply
  const renderReplies = (replies) => {
    if (!Array.isArray(replies) || replies.length === 0) return null;
    return (
      <div style={{ 
          marginTop: 12, 
          background: "rgba(255, 255, 255, 0.6)", 
          padding: "12px 16px", 
          borderRadius: 8,
          borderLeft: "3px solid #1890ff"
      }}>
          {replies.map(reply => (
              <div key={reply.id}>
                  <Space style={{ marginBottom: 4 }}>
                      <ShopOutlined style={{ color: "#1890ff" }} />
                      <Text strong style={{ color: "#1890ff", fontSize: 13 }}>Phản hồi của Cửa hàng</Text>
                      <CheckCircleFilled style={{ color: "#1890ff", fontSize: 12 }} />
                  </Space>
                  <div style={{ color: "#555", fontSize: 14 }}>
                      {reply.reply_text || reply.comment}
                  </div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {reply.created_at ? new Date(reply.created_at).toLocaleString('vi-VN') : ""}
                  </Text>
              </div>
          ))}
      </div>
    );
  };

  return (
    <Card 
      style={{ marginTop: 24, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} 
      bodyStyle={{ padding: "24px 32px" }}
      id="reviews-section"
    >
      <Title level={4} style={{ marginBottom: 24 }}>Đánh giá sản phẩm ({visibleReviews.length + (myReview ? 1 : 0)})</Title>

      {/* --- KHU VỰC 1: ĐÁNH GIÁ CỦA TÔI / FORM VIẾT ĐÁNH GIÁ --- */}
      <div style={{ marginBottom: 32 }}>
        {user ? (
          myReview ? (
            // TRƯỜNG HỢP 1: Đã đánh giá -> Hiện review của mình
            <div style={{ 
              background: myReview.is_hidden ? "#fff1f0" : "#f6ffed", 
              border: myReview.is_hidden ? "1px solid #ffa39e" : "1px solid #b7eb8f",
              padding: 20, 
              borderRadius: 8 
            }}>
              <Space style={{ marginBottom: 8, justifyContent: "space-between", width: "100%" }}>
                <Space>
                    <Text strong style={{ fontSize: 16 }}>Đánh giá của bạn</Text>
                    {myReview.is_hidden && <Tag color="error">Đã bị ẩn</Tag>}
                </Space>
                <Rate disabled value={myReview.rating} style={{ fontSize: 16 }} />
              </Space>
              
              <Text style={{ display: "block", color: "#333", fontSize: 15, marginBottom: 8 }}>
                {myReview.comment}
              </Text>
              
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(myReview.created_at).toLocaleString('vi-VN')}
              </Text>
              {renderReplies(myReview.replies)}
            </div>
          ) : (
            // TRƯỜNG HỢP 2: Chưa đánh giá
            // KIỂM TRA: Đã mua hàng chưa?
            hasPurchased ? (
                // Đã mua -> Hiện Form
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 12 }}>
                            <Text style={{ marginRight: 12 }}>Chất lượng sản phẩm:</Text>
                            <Rate value={newRating} onChange={onNewRatingChange} />
                        </div>
                        <TextArea
                            rows={3}
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                            value={newComment}
                            onChange={(e) => onNewCommentChange(e.target.value)}
                            style={{ marginBottom: 12, borderRadius: 6 }}
                        />
                        <div style={{ textAlign: "right" }}>
                            <Button 
                                type="primary" 
                                icon={<SendOutlined />} 
                                onClick={onSubmitReview}
                                disabled={!newRating}
                            >
                                Gửi đánh giá
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                // Chưa mua -> Hiện thông báo chặn
                <Alert
                    message="Chưa mua sản phẩm"
                    description="Bạn cần mua sản phẩm này để có thể viết đánh giá."
                    type="info"
                    showIcon
                    icon={<ShoppingCartOutlined />}
                    style={{ background: "#f0f5ff", border: "1px solid #d6e4ff" }}
                />
            )
          )
        ) : (
          // TRƯỜNG HỢP 3: Chưa đăng nhập
          <div style={{ textAlign: "center", padding: "20px 0", background: "#fafafa", borderRadius: 8 }}>
             <Text type="secondary">Vui lòng đăng nhập để gửi đánh giá</Text>
          </div>
        )}
      </div>

      <Divider />

      {/* --- KHU VỰC 2: DANH SÁCH REVIEW KHÁC (GIỮ NGUYÊN) --- */}
      <List
        className="comment-list"
        itemLayout="horizontal"
        dataSource={visibleReviews}
        locale={{ emptyText: <Empty description="Chưa có đánh giá nào khác" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(item) => (
          <List.Item style={{ padding: "20px 0", borderBottom: "1px solid #f0f0f0" }}>
            <List.Item.Meta
              avatar={
                <Avatar 
                    src={item.user_avatar} 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: "#fde3cf", color: "#f56a00" }} 
                >
                    {item.user_name?.charAt(0)?.toUpperCase()}
                </Avatar>
              }
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>{item.user_name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                </div>
              }
              description={
                <div style={{ marginTop: 4 }}>
                    <Rate disabled value={item.rating} style={{ fontSize: 14, color: "#faad14", marginRight: 8 }} />
                    <div style={{ marginTop: 8, color: "#434343", fontSize: 15, lineHeight: 1.6 }}>
                        {item.comment}
                    </div>
                    {renderReplies(item.replies)}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default ReviewsSection;