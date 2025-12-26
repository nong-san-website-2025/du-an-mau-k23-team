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
  Space,
  Image
} from "antd";
import { UserOutlined, ShopOutlined, CheckCircleFilled, WarningFilled, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// ============================================================================
// [HELPER] Xử lý đường dẫn ảnh (Từ HEAD)
// ============================================================================
const getImageUrl = (imgData) => {
  if (!imgData) return "";

  // Lấy đường dẫn từ object hoặc string
  const src = imgData.image || imgData.url || imgData;
  if (!src) return "";

  // Nếu là link đầy đủ (http...) thì giữ nguyên
  if (typeof src === 'string' && src.startsWith("http")) {
    return src;
  }

  // Nếu là link tương đối (/media...), ghép thêm domain server
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const BASE_URL = API_URL.replace(/\/api\/?$/, ""); // Bỏ đuôi /api
  const cleanSrc = src.startsWith("/") ? src : `/${src}`;

  return `${BASE_URL}${cleanSrc}`;
};

// ============================================================================
// [HELPER] Xử lý Spam & Từ khóa cấm (Từ TriThuc2)
// ============================================================================
const BANNED_KEYWORDS = [
  "lừa đảo", "vô học", "chết tiệt", "ngu", "rác", "tệ hại"
];

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

  // 4. Chứa từ khóa cấm
  return BANNED_KEYWORDS.some(keyword => {
      const regex = new RegExp(`(^|[\\s.,;!?()"'])` + keyword + `($|[\\s.,;!?()"'])`, 'i');
      return regex.test(content);
  });
};

// ============================================================================
// [COMPONENT] ReviewItem: Hiển thị 1 dòng review
// ============================================================================
const ReviewItem = ({ review, isMyReview = false }) => {
  const { user_name, rating, comment, created_at, replies, is_hidden, images } = review;

  return (
    <div style={{ padding: "24px 0" }}>
      <Row gutter={[16, 16]} wrap={false}>
        {/* Cột Avatar */}
        <Col flex="48px">
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{ backgroundColor: isMyReview ? '#1890ff' : '#f56a00', fontSize: 20 }}
          >
            {user_name ? user_name.charAt(0).toUpperCase() : "U"}
          </Avatar>
        </Col>

        {/* Cột Nội dung */}
        <Col flex="auto">
          {/* Header: Tên + Ngày + Tag */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Space>
              <Text strong style={{ fontSize: 16, color: "#262626" }}>
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
          <div style={{ marginBottom: 12 }}>
            <Rate disabled value={rating} style={{ fontSize: 14, color: "#fadb14" }} />
          </div>

          {/* Comment Content */}
          <Paragraph 
            style={{ 
              color: is_hidden ? "#8c8c8c" : "#434343", 
              fontStyle: is_hidden ? "italic" : "normal",
              marginBottom: 16,
              fontSize: 15,
              lineHeight: 1.6
            }}
          >
            {is_hidden 
              ? "Đánh giá của bạn đang được Admin kiểm duyệt để đảm bảo tiêu chuẩn cộng đồng. Xin vui lòng chờ." 
              : comment
            }
          </Paragraph>

          {/* Danh sách ảnh đánh giá (Sử dụng getImageUrl từ HEAD) */}
          {!is_hidden && images && images.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Image.PreviewGroup>
                <Space size={8} wrap>
                  {images.map((img, idx) => (
                    <Image
                      key={idx}
                      width={80}
                      height={80}
                      src={getImageUrl(img)}
                      style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0", cursor: "pointer" }}
                      alt="Review image"
                      fallback="https://via.placeholder.com/80?text=Error"
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </div>
          )}

          {/* Seller Reply Section */}
          {Array.isArray(replies) && replies.length > 0 && (
            <div
              style={{
                backgroundColor: "#f6ffed",
                border: "1px solid #b7eb8f",
                padding: "16px",
                borderRadius: 8,
                marginTop: 16,
              }}
            >
              {replies.map((rp) => (
                <div key={rp.id}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <ShopOutlined style={{ color: "#52c41a", marginRight: 8, fontSize: 18 }} />
                    <Text strong style={{ color: "#389e0d" }}>Phản hồi từ Cửa hàng</Text>
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

// ============================================================================
// [COMPONENT] RatingSummary: Tổng quan đánh giá (Header)
// ============================================================================
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
    <div style={{ marginBottom: 32, padding: "24px", background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
      <Row gutter={[32, 16]} align="middle">
        {/* Bên trái: Điểm trung bình */}
        <Col xs={24} sm={8} style={{ textAlign: "center", borderRight: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 48, fontWeight: "bold", color: "#fadb14", lineHeight: 1, marginBottom: 8 }}>
            {average} <span style={{ fontSize: 24, color: "#999" }}>/ 5</span>
          </div>
          <Rate disabled allowHalf value={parseFloat(average)} style={{ color: "#fadb14", fontSize: 20 }} />
          <div style={{ marginTop: 8, color: "#666", fontSize: 16 }}>({total} đánh giá)</div>
        </Col>

        {/* Bên phải: Progress bar */}
        <Col xs={24} sm={16} style={{ paddingLeft: 32 }}>
          {[5, 4, 3, 2, 1].map(star => (
            <Row key={star} gutter={16} align="middle" style={{ marginBottom: 8 }}>
              <Col style={{ minWidth: 60, textAlign: "right" }}>
                <Text strong>{star} sao</Text>
              </Col>
              <Col flex="auto">
                <Progress
                  percent={(counts[star] / total) * 100}
                  showInfo={false}
                  strokeColor="#fadb14"
                  trailColor="#e6e6e6"
                  size="small"
                  style={{ marginBottom: 0 }}
                />
              </Col>
              <Col style={{ minWidth: 40, textAlign: "right" }}>
                <Text type="secondary">{counts[star]}</Text>
              </Col>
            </Row>
          ))}
        </Col>
      </Row>
    </div>
  );
};

// ============================================================================
// [MAIN COMPONENT] ReviewsSection
// ============================================================================
const ReviewsSection = ({ user, reviews, myReview }) => {

  // 1. Lọc danh sách Review công khai (Không ẩn) - Logic từ TriThuc2
  const visibleReviews = useMemo(() => {
    if (!reviews) return [];
    // Tự động phát hiện: Array hoặc Object phân trang
    const reviewsList = Array.isArray(reviews) ? reviews : (reviews.results || []);
    
    if (!Array.isArray(reviewsList)) return [];
    return reviewsList.filter(r => !r.is_hidden);
  }, [reviews]);

  // 2. Kiểm tra xem Review của tôi có bị Spam không? - Logic từ TriThuc2
  const isMyReviewSpam = useMemo(() => {
    if (!myReview) return false;
    return checkIsSpam(myReview.comment);
  }, [myReview]);

  // 3. Điều kiện hiển thị My Review
  // Hiển thị nếu: Admin đã duyệt HOẶC (chưa duyệt nhưng KHÔNG phải Spam)
  const shouldShowMyReview = myReview && (!myReview.is_hidden || !isMyReviewSpam);

  return (
    <Card 
      bordered={false} 
      style={{ marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderRadius: 8 }}
      bodyStyle={{ padding: "24px 32px" }} // Merge: Padding của TriThuc2 + BorderRadius của HEAD
    >
      <Title level={4} style={{ marginBottom: 24 }}>Đánh giá sản phẩm</Title>

      {/* 1. Phần tổng quan điểm số */}
      <RatingSummary reviews={visibleReviews} />

      {/* 2. Review của tôi */}
      {user && shouldShowMyReview && (
        <>
          <div 
            style={{ 
              // Merge colors: Sử dụng tông màu Vàng (TriThuc2) cho trạng thái chờ duyệt
              // vì nó hợp lý hơn màu Đỏ (HEAD) cho ngữ cảnh "Pending"
              border: `1px solid ${myReview.is_hidden ? '#ffe58f' : '#b7eb8f'}`, 
              backgroundColor: myReview.is_hidden ? '#fffbe6' : '#f6ffed',
              borderRadius: 8, 
              padding: "0 24px", // Merge: Padding rộng hơn của HEAD
              marginBottom: 32 
            }}
          >
            <ReviewItem review={myReview} isMyReview={true} />
          </div>
          {visibleReviews.length > 0 && <Divider orientation="left" style={{ borderColor: "#d9d9d9" }}>Đánh giá từ khách hàng khác</Divider>}
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
            // Scroll logic here if needed
          }
        }}
        renderItem={(item) => (
          // Chỉ render nếu không phải là myReview (tránh lặp lại)
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