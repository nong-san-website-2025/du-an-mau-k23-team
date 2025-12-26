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
import { UserOutlined, ShopOutlined, CheckCircleFilled, WarningFilled } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// --- [MỚI] Hàm xử lý đường dẫn ảnh ---
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
  // Lấy API_URL từ biến môi trường, hoặc dùng mặc định
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  // Loại bỏ đuôi '/api' để lấy domain gốc (VD: http://localhost:8000)
  const BASE_URL = API_URL.replace(/\/api\/?$/, "");
  
  // Đảm bảo không bị duplicate dấu /
  const cleanSrc = src.startsWith("/") ? src : `/${src}`;
  
  return `${BASE_URL}${cleanSrc}`;
};

// --- SUB-COMPONENT: Hiển thị 1 dòng review ---
const ReviewItem = ({ review, isMyReview = false }) => {
  // Lấy thêm trường images từ review
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
          {/* Header: Tên + Ngày + Tag (nếu là my review) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Space>
              <Text strong style={{ fontSize: 16, color: "#262626" }}>
                {isMyReview ? "Bạn (Đánh giá của tôi)" : user_name}
              </Text>
              {isMyReview && is_hidden && (
                <Tag icon={<WarningFilled />} color="error">Đã bị ẩn</Tag>
              )}
              {isMyReview && !is_hidden && (
                <Tag icon={<CheckCircleFilled />} color="success">Đã duyệt</Tag>
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
              color: is_hidden ? "#999" : "#434343",
              fontStyle: is_hidden ? "italic" : "normal",
              marginBottom: 16,
              fontSize: 15,
              lineHeight: 1.6
            }}
          >
            {is_hidden ? "Nội dung đánh giá này đã bị ẩn do vi phạm tiêu chuẩn cộng đồng." : comment}
          </Paragraph>

          {/* [ĐÃ SỬA] Hiển thị danh sách ảnh đánh giá dùng hàm getImageUrl */}
          {!is_hidden && images && images.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Image.PreviewGroup>
                <Space size={8} wrap>
                  {images.map((img, idx) => (
                    <Image
                      key={idx}
                      width={80}
                      height={80}
                      src={getImageUrl(img)} // Dùng hàm helper để fix link ảnh
                      style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0", cursor: "pointer" }}
                      alt="Review image"
                      fallback="https://via.placeholder.com/80?text=Error" // Ảnh thay thế nếu lỗi
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
    <div style={{ marginBottom: 32, padding: "24px", background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
      <Row gutter={[32, 16]} align="middle">
        {/* Bên trái: Điểm trung bình to đùng */}
        <Col xs={24} sm={8} style={{ textAlign: "center", borderRight: "1px solid #f0f0f0" }}>
           <div style={{ fontSize: 48, fontWeight: "bold", color: "#fadb14", lineHeight: 1, marginBottom: 8 }}>
             {average} <span style={{ fontSize: 24, color: "#999" }}>/ 5</span>
           </div>
           <Rate disabled allowHalf value={parseFloat(average)} style={{ color: "#fadb14", fontSize: 20 }} />
           <div style={{ marginTop: 8, color: "#666", fontSize: 16 }}>({total} đánh giá)</div>
        </Col>

        {/* Bên phải: Progress bar từng dòng */}
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

// --- MAIN COMPONENT ---
const ReviewsSection = ({ user, reviews, myReview }) => {
  
  const visibleReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(r => !r.is_hidden);
  }, [reviews]);

  return (
    <Card 
      bordered={false} 
      style={{ marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderRadius: 8 }} 
      bodyStyle={{ padding: "32px" }}
    >
      <Title level={4} style={{ marginBottom: 24 }}>Đánh giá sản phẩm</Title>

      {/* 1. Phần tổng quan điểm số */}
      <RatingSummary reviews={visibleReviews} />

      {/* 2. Review của tôi (Nổi bật) */}
      {user && myReview && (
        <>
          <div 
            style={{ 
              border: `1px solid ${myReview.is_hidden ? '#ffccc7' : '#b7eb8f'}`, 
              backgroundColor: myReview.is_hidden ? '#fff2f0' : '#f6ffed',
              borderRadius: 8, 
              padding: "0 24px",
              marginBottom: 32 
            }}
          >
            <ReviewItem review={myReview} isMyReview={true} />
          </div>
          {visibleReviews.length > 0 && <Divider orientation="left" style={{ borderColor: "#d9d9d9" }}>Đánh giá từ khách hàng khác</Divider>}
        </>
      )}

      {/* 3. Danh sách Review */}
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
          // Chỉ render nếu không phải là myReview (để tránh lặp lại nếu myReview nằm trong list trả về)
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