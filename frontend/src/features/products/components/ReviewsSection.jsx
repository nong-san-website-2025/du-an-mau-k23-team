// src/components/ProductDetail/ReviewsSection.jsx
import React, { useMemo } from "react"; // Thêm useMemo để tối ưu hiệu năng
import { Card, Button, Input, Rate, List, Space, Typography, Tag } from "antd"; // Thêm Tag nếu muốn hiện trạng thái cho chính chủ
import { AiFillStar } from "react-icons/ai";

const { TextArea } = Input;
const { Title, Text } = Typography;

const ReviewsSection = ({
  user,
  reviews,
  myReview,
  newComment,
  newRating,
  hasReviewed,
  onNewCommentChange,
  onNewRatingChange,
  onSubmitReview,
}) => {
  
  // ✅ LOGIC SENIOR: Lọc review hiển thị
  // 1. Nếu là Admin/Seller (có cờ is_staff/seller): Có thể muốn xem hết -> Tùy logic bạn, ở đây tôi làm cho User thường.
  // 2. User thường: Chỉ hiện review không bị ẩn (is_hidden === false)
  const visibleReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(r => !r.is_hidden);
  }, [reviews]);

  return (
    <Card title={`Đánh giá & Bình luận (${visibleReviews.length})`} style={{ marginTop: 24 }}>
      {user ? (
        myReview ? (
          <Card
            style={{ 
                backgroundColor: myReview.is_hidden ? "#fff1f0" : "#f6ffed", // Đổi màu nếu bị ẩn
                border: myReview.is_hidden ? "1px solid #ffa39e" : "1px solid #b7eb8f" 
            }}
          >
            <Space>
                <Text type={myReview.is_hidden ? "danger" : "success"} strong>
                    {myReview.is_hidden ? "Đánh giá của bạn đã bị ẩn" : "Bạn đã đánh giá sản phẩm này"}
                </Text>
                {myReview.is_hidden && <Tag color="red">Vi phạm tiêu chuẩn cộng đồng</Tag>}
            </Space>
            
            <div style={{ marginTop: 8 }}>
              <Rate disabled value={myReview.rating} />
            </div>
            <p style={{ color: myReview.is_hidden ? '#999' : 'inherit' }}>{myReview.comment}</p>
            <Text type="secondary">
              {new Date(myReview.created_at).toLocaleString()}
            </Text>
          </Card>
        ) : (
          /* ... Giữ nguyên phần Form nhập đánh giá ... */
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <Text>Đánh giá:</Text>
                <Rate value={newRating} onChange={onNewRatingChange} />
              </Space>
              <TextArea
                rows={3}
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={(e) => onNewCommentChange(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="primary" onClick={onSubmitReview}>
                  Gửi đánh giá
                </Button>
              </div>
            </Space>
          </div>
        )
      ) : (
        <Text type="secondary">Đăng nhập để đánh giá</Text>
      )}

      <List
        // ✅ CHỈNH SỬA Ở ĐÂY: Thay 'reviews' bằng 'visibleReviews'
        dataSource={visibleReviews} 
        
        locale={{ emptyText: "Chưa có đánh giá nào" }}
        renderItem={(r) => (
          <List.Item
            style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}
          >
            <div>
              <Text strong>{r.user_name}</Text>
              <Rate disabled value={r.rating} style={{ marginLeft: 8 }} />
            </div>
            <p>{r.comment}</p>
            <Text type="secondary">
              {new Date(r.created_at).toLocaleString()}
            </Text>

            {/* Render seller / admin replies */}
            {Array.isArray(r.replies) && r.replies.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {r.replies.map((rp) => (
                  <div
                    key={rp.id}
                    style={{
                      background: "#f6ffed",
                      border: "1px solid #e6f4ea",
                      padding: 10,
                      borderRadius: 8,
                      marginTop: 8,
                      color: "#14532d",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Cửa hàng
                      <span style={{ fontWeight: 400, marginLeft: 8, color: "#4b5563", fontSize: 12 }}>
                        {rp.created_at ? new Date(rp.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <Text
                      ellipsis={{
                        rows: 3,
                        expandable: true,
                        symbol: "Xem thêm",
                      }}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {rp.reply_text || rp.comment || rp.detail || ""}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </List.Item>
        )}
      />
    </Card>
  );
};

export default ReviewsSection;