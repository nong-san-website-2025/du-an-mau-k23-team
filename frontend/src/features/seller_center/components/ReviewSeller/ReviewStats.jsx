import React from "react";
import { Card, Row, Col, Statistic, Progress, Space } from "antd";
import { StarOutlined, MessageOutlined, ClockCircleOutlined, TrophyOutlined } from "@ant-design/icons";

const ReviewStats = ({ summary }) => {
  if (!summary) return null;

  const { totalReviews, averageRating, pendingReplies, starsDistribution } = summary;

  // Tính phần trăm cho mỗi sao
  const getStarPercentage = (star) => {
    const count = starsDistribution[star.toString()] || 0;
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Thống kê tổng quan */}
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Tổng đánh giá"
              value={totalReviews}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Đánh giá trung bình"
              value={averageRating}
              precision={1}
              prefix={<TrophyOutlined />}
              suffix="/5"
              valueStyle={{ color: averageRating >= 4 ? '#52c41a' : averageRating >= 3 ? '#faad14' : '#ff4d4f' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Chưa trả lời"
              value={pendingReplies}
              prefix={<MessageOutlined />}
              valueStyle={{ color: pendingReplies > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Tỷ lệ trả lời"
              value={totalReviews > 0 ? ((totalReviews - pendingReplies) / totalReviews * 100) : 0}
              precision={1}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Phân bố đánh giá theo sao */}
      <Card
        title="Phân bố đánh giá"
        size="small"
        style={{ marginTop: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 60, textAlign: 'right' }}>
                <Space>
                  <span>{star}</span>
                  <StarOutlined style={{ color: '#faad14', fontSize: '14px' }} />
                </Space>
              </div>
              <div style={{ flex: 1 }}>
                <Progress
                  percent={getStarPercentage(star)}
                  size="small"
                  strokeColor={
                    star >= 4 ? '#52c41a' :
                    star >= 3 ? '#faad14' : '#ff4d4f'
                  }
                  showInfo={false}
                />
              </div>
              <div style={{ minWidth: 40, textAlign: 'right', fontSize: '12px', color: '#666' }}>
                {starsDistribution[star.toString()] || 0}
              </div>
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
};

export default ReviewStats;