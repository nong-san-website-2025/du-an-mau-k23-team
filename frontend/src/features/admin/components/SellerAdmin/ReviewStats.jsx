import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Empty,
  Tag,
  Rate,
  Avatar,
  Space,
  Tooltip,
  Button,
  Modal,
} from "antd";

import {
  StarFilled,
  MessageOutlined,
  RiseOutlined,
  EyeOutlined,
  LikeOutlined,
  DislikeOutlined,
  ProfileOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

export default function ReviewStats({ analytics }) {
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  if (!analytics) {
    return <Empty description="Chưa có dữ liệu đánh giá" />;
  }

  const reviews = analytics.reviews || {};
  const reviewList = analytics.review_list || [];
  const ratingDistribution = analytics.rating_distribution || {};

  const ratingData = [
    { star: 5, count: ratingDistribution.five_star || 0 },
    { star: 4, count: ratingDistribution.four_star || 0 },
    { star: 3, count: ratingDistribution.three_star || 0 },
    { star: 2, count: ratingDistribution.two_star || 0 },
    { star: 1, count: ratingDistribution.one_star || 0 },
  ];

  const totalReviews =
    ratingData.reduce((sum, item) => sum + item.count, 0) || 1;

  const positiveKeywords = analytics.positive_keywords || [];
  const negativeKeywords = analytics.negative_keywords || [];

  const responseRate = analytics.response_rate || 0;
  const respondedCount = analytics.responded_count || 0;

  const reviewColumns = [
    {
      title: "Người mua",
      dataIndex: "buyer_name",
      key: "buyer_name",
      width: 120,
      render: (text) => (
        <Space>
          <Avatar style={{ backgroundColor: "#87d068" }}>
            {text?.charAt(0)}
          </Avatar>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      width: 100,
      render: (rating) => <Rate disabled defaultValue={rating} count={5} />,
    },
    {
      title: "Nhận xét",
      dataIndex: "comment",
      key: "comment",
      width: 300,
      render: (text) => (
        <Tooltip title={text}>
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "300px",
            }}
          >
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 130,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Phản hồi",
      dataIndex: "has_response",
      key: "has_response",
      width: 100,
      render: (hasResponse) => (
        <Tag color={hasResponse ? "green" : "red"}>
          {hasResponse ? "✓ Đã phản hồi" : "Chưa phản hồi"}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      {/* 3 thẻ thống kê đầu */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={8}>
          <Card
            style={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)",
            }}
          >
            <Statistic
              title="Điểm trung bình"
              value={reviews.avg_rating || 0}
              precision={1}
              prefix={<StarFilled style={{ color: "#f59e0b" }} />}
              suffix="/5"
              valueStyle={{
                fontSize: "28px",
                fontWeight: 600,
                color: "#92400e",
              }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
            }}
          >
            <Statistic
              title="Số lượt đánh giá"
              value={reviews.total_reviews || 0}
              prefix={<MessageOutlined style={{ color: "#0369a1" }} />}
              valueStyle={{
                fontSize: "28px",
                fontWeight: 600,
                color: "#0c4a6e",
              }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            }}
          >
            <Statistic
              title="Tỷ lệ phản hồi"
              value={responseRate}
              precision={1}
              prefix={<RiseOutlined style={{ color: "#059669" }} />}
              suffix="%"
              valueStyle={{
                fontSize: "28px",
                fontWeight: 600,
                color: "#065f46",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Phân loại đánh giá theo sao */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <StarFilled style={{ color: "#f59e0b" }} />
                <span>Phân loại đánh giá theo sao</span>
              </Space>
            }
            style={{ borderRadius: "8px" }}
          >
            {ratingData.map((item) => {
              const percentage = (item.count / totalReviews) * 100;

              return (
                <div
                  key={item.star}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ minWidth: "60px" }}>
                    <Rate disabled defaultValue={item.star} count={5} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <Progress
                      percent={percentage.toFixed(2)}
                      strokeColor={
                        item.star >= 4
                          ? "#52c41a"
                          : item.star === 3
                          ? "#faad14"
                          : "#ff4d4f"
                      }
                      showInfo={false}
                    />
                  </div>

                  <div style={{ minWidth: "80px" }}>
                    <strong>{item.count}</strong>{" "}
                    <span style={{ color: "#6b7280" }}>
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>


      {/* Danh sách đánh giá gần đây */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ProfileOutlined style={{ color: "#0ea5e9" }} />
                <span>Đánh giá gần đây</span>
              </Space>
            }
            extra={
              reviewList.length > 0 && (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => setReviewsModalVisible(true)}
                >
                  Xem tất cả
                </Button>
              )
            }
            style={{ borderRadius: "8px" }}
          >
            {reviewList.length > 0 ? (
              <Table
                columns={reviewColumns}
                dataSource={reviewList.slice(0, 5).map((item, idx) => ({
                  ...item,
                  key: idx,
                }))}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="Chưa có đánh giá" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal xem tất cả đánh giá */}
      <Modal
        title="Danh sách đánh giá chi tiết"
        open={reviewsModalVisible}
        onCancel={() => setReviewsModalVisible(false)}
        width={1000}
        footer={null}
      >
        {reviewList.length > 0 ? (
          <Table
            columns={reviewColumns}
            dataSource={reviewList.map((item, idx) => ({
              ...item,
              key: idx,
            }))}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        ) : (
          <Empty description="Chưa có đánh giá" />
        )}
      </Modal>
    </div>
  );
}
