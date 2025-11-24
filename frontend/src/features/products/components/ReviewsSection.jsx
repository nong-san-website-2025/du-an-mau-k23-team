import React from "react";
import { Card, Button, Input, Rate, List, Space, Typography } from "antd";
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
  return (
    <Card title="Đánh giá & Bình luận" style={{ marginTop: 24 }}>
      {user ? (
        myReview ? (
          <Card style={{ backgroundColor: "#f6ffed", border: "1px solid #b7eb8f" }}>
            <Text type="success">✅ Bạn đã đánh giá sản phẩm này</Text>
            <div style={{ marginTop: 8 }}>
              <Rate disabled value={myReview.rating} />
            </div>
            <p>{myReview.comment}</p>
            <Text type="secondary">
              {new Date(myReview.created_at).toLocaleString()}
            </Text>
          </Card>
        ) : (
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
              <Button type="primary" onClick={onSubmitReview}>
                Gửi đánh giá
              </Button>
            </Space>
          </div>
        )
      ) : (
        <Text type="secondary">Đăng nhập để đánh giá</Text>
      )}

      <List
        dataSource={reviews}
        renderItem={(r) => (
          <List.Item style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div>
              <Text strong>{r.user_name}</Text>
              <Rate disabled value={r.rating} style={{ marginLeft: 8 }} />
            </div>
            <p>{r.comment}</p>
            <Text type="secondary">{new Date(r.created_at).toLocaleString()}</Text>

            {/* Render seller / admin replies if present */}
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
                      ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
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