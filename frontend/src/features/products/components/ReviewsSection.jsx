// src/components/ProductDetail/ReviewsSection.jsx
import React, { useMemo } from "react";
import { 
  Card, 
  Rate, 
  List, 
  Typography, 
  Tag, 
  Avatar, 
  Row, 
  Col, 
  Progress, 
  Divider,
  Space
} from "antd";
import { UserOutlined, ShopOutlined, CheckCircleFilled, WarningFilled, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// [CẤU HÌNH] Danh sách từ khóa cấm
const BANNED_KEYWORDS = [
  "lừa đảo", "vô học", "chết tiệt", "ngu", "rác", "tệ hại"
];

// --- [ĐÃ SỬA] HÀM KIỂM TRA SPAM CHÍNH XÁC ---
const checkIsSpam = (comment) => {
  if (!comment) return true;
  const content = comment.trim().toLowerCase();

  // 1. Quá ngắn
  if (content.length < 5) return true;

  // 2. Chuỗi dài không khoảng trắng
  if (!content.includes(" ") && content.length > 15) return true;

  // 3. Ký tự lặp lại quá nhiều
  const repeatPattern = /(.)\1{4,}/; 
  if (repeatPattern.test(content)) return true;

  // 4. Chứa từ khóa cấm (Bắt chính xác)
  return BANNED_KEYWORDS.some(keyword => {
      const regex = new RegExp(`(^|[\\s.,;!?()"'])` + keyword + `($|[\\s.,;!?()"'])`, 'i');
      return regex.test(content);
  });
};

// --- SUB-COMPONENT: Hiển thị 1 dòng review ---
const ReviewItem = ({ review, isMyReview = false }) => {
  const { user_name, rating, comment, created_at, replies, is_hidden } = review;

  return (
    <div style={{ padding: "16px 0" }}>
      <Row gutter={[16, 16]} wrap={false}>
        {/* Cột Avatar */}
        <Col flex="40px">
          <Avatar 
            size="large" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: isMyReview ? '#1890ff' : '#f56a00' }}
          >
            {user_name ? user_name.charAt(0).toUpperCase() : "U"}
          </Avatar>
        </Col>

        {/* Cột Nội dung */}
        <Col flex="auto">
          {/* Header: Tên + Ngày + Tag (nếu là my review) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Space>
              <Text strong style={{ fontSize: 16 }}>
                {isMyReview ? "Bạn (Đánh giá của tôi)" : user_name}
              </Text>
              
              {isMyReview && is_hidden && (
                <Tag icon={<ClockCircleOutlined />} color="warning">Đang chờ duyệt</Tag>
              )}
              {isMyReview && !is_hidden && (
                <Tag icon={<CheckCircleFilled />} color="success">Đã được duyệt</Tag>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(created_at).toLocaleDateString("vi-VN")}
            </Text>
          </div>

          {/* Rating */}
          <div style={{ marginBottom: 8 }}>
            <Rate disabled value={rating} style={{ fontSize: 14 }} />
          </div>

          {/* Comment Content */}
          <Paragraph 
            style={{ 
              color: is_hidden ? "#8c8c8c" : "inherit", 
              fontStyle: is_hidden ? "italic" : "normal",
              marginBottom: 12
            }}
          >
            {is_hidden 
              ? "Đánh giá của bạn đang được Admin kiểm duyệt để đảm bảo tiêu chuẩn cộng đồng. Xin vui lòng chờ." 
              : comment
            }
          </Paragraph>

          {/* Seller Reply Section */}
          {Array.isArray(replies) && replies.length > 0 && (
            <div
              style={{
                backgroundColor: "#f9f9f9",
                borderLeft: "4px solid #00b96b", // Màu thương hiệu GreenFarm
                padding: "12px 16px",
                borderRadius: "0 8px 8px 0",
                marginTop: 12,
              }}
            >
              {replies.map((rp) => (
                <div key={rp.id}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                    <ShopOutlined style={{ color: "#00b96b", marginRight: 8, fontSize: 16 }} />
                    <Text strong style={{ color: "#00b96b" }}>Phản hồi từ Cửa hàng</Text>
                    <Divider type="vertical" />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {rp.created_at ? new Date(rp.created_at).toLocaleDateString("vi-VN") : ""}
                    </Text>
                  </div>
                  <Text style={{ whiteSpace: "pre-wrap", color: "#555" }}>
                    {rp.reply_text || rp.comment || rp.detail || ""}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

// --- SUB-COMPONENT: Tổng quan đánh giá (Header) ---
const RatingSummary = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return null;

  const total = reviews.length;
  const average = (reviews.reduce((acc, cur) => acc + cur.rating, 0) / total).toFixed(1);
  
  // Đếm số lượng từng sao
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const rounded = Math.round(r.rating);
    if (counts[rounded] !== undefined) counts[rounded]++;
  });

  return (
    <div style={{ marginBottom: 32, padding: "20px", background: "#fafafa", borderRadius: 8 }}>
      <Row gutter={[32, 16]} align="middle">
        {/* Bên trái: Điểm trung bình to đùng */}
        <Col xs={24} sm={8} style={{ textAlign: "center" }}>
           <div style={{ fontSize: 48, fontWeight: "bold", color: "#00b96b", lineHeight: 1 }}>
             {average}
           </div>
           <Rate disabled allowHalf value={parseFloat(average)} style={{ color: "#00b96b" }} />
           <div style={{ marginTop: 8, color: "#666" }}>{total} đánh giá</div>
        </Col>

        {/* Bên phải: Progress bar từng dòng */}
        <Col xs={24} sm={16}>
          {[5, 4, 3, 2, 1].map(star => (
            <Row key={star} gutter={8} align="middle" style={{ marginBottom: 4 }}>
              <Col span={3} style={{ textAlign: "right", whiteSpace: 'nowrap' }}>
                <Text type="secondary">{star} sao</Text>
              </Col>
              <Col flex="auto">
                <Progress 
                  percent={(counts[star] / total) * 100} 
                  showInfo={false} 
                  strokeColor="#00b96b" 
                  trailColor="#e6e6e6"
                  size="small"
                />
              </Col>
              <Col span={3} style={{ textAlign: "right" }}>
                <Text type="secondary">{counts[star]}</Text>
              </Col>
            </Row>
          ))}
        </Col>
      </Row>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ReviewsSection = ({ user, reviews, myReview }) => {
  
  // 1. Lọc danh sách Review công khai (Không ẩn)
  const visibleReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(r => !r.is_hidden);
  }, [reviews]);

  // 2. Kiểm tra xem Review của tôi có bị Spam không?
  const isMyReviewSpam = useMemo(() => {
    if (!myReview) return false;
    return checkIsSpam(myReview.comment);
  }, [myReview]);

  // --- [ĐÃ SỬA] ĐIỀU KIỆN HIỂN THỊ MY REVIEW ---
  // Hiển thị nếu:
  // - Admin đã duyệt (myReview.is_hidden === false) --> Ưu tiên số 1
  // - HOẶC chưa duyệt nhưng KHÔNG phải Spam (!isMyReviewSpam) --> Chờ duyệt hợp lệ
  const shouldShowMyReview = myReview && (!myReview.is_hidden || !isMyReviewSpam);

  return (
    <Card 
      bordered={false} 
      style={{ marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      bodyStyle={{ padding: "24px 32px" }}
    >
      <Title level={4} style={{ marginBottom: 24 }}>Đánh giá sản phẩm</Title>

      {/* 1. Phần tổng quan điểm số */}
      <RatingSummary reviews={visibleReviews} />

      {/* 2. Review của tôi */}
      {user && shouldShowMyReview && (
        <>
          <div 
            style={{ 
              border: `1px solid ${myReview.is_hidden ? '#ffe58f' : '#b7eb8f'}`, 
              backgroundColor: myReview.is_hidden ? '#fffbe6' : '#f6ffed',
              borderRadius: 8, 
              padding: "0 16px",
              marginBottom: 32 
            }}
          >
            <ReviewItem review={myReview} isMyReview={true} />
          </div>
          {visibleReviews.length > 0 && <Divider orientation="left">Đánh giá từ khách hàng khác</Divider>}
        </>
      )}

      {/* 3. Danh sách Review công khai */}
      <List
        dataSource={visibleReviews}
        locale={{ emptyText: "Chưa có đánh giá nào cho sản phẩm này." }}
        itemLayout="vertical"
        pagination={{
          pageSize: 5,
          hideOnSinglePage: true,
          onChange: () => {
             // Scroll nhẹ lên đầu list khi chuyển trang nếu cần
          }
        }}
        renderItem={(item) => (
          // Chỉ render nếu không phải là myReview (để tránh lặp lại)
          (!myReview || item.id !== myReview.id) ? (
            <List.Item style={{ padding: 0 }}>
               <ReviewItem review={item} />
               <Divider style={{ margin: "0" }} />
            </List.Item>
          ) : null
        )}
      />
    </Card>
  );
};
export default ReviewsSection;