// components/Common/StatsSection.jsx
import React from "react";
import { Row, Col, Card, Typography, Skeleton } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import "./StatsSection.css";

const { Title, Text } = Typography;

const StatsSection = ({ items = [], loading = false }) => {
  return (
    <div className="common-stats-section">
      <Row gutter={[24, 24]}>
        {items.map((item, index) => (
          <Col key={index} xs={24} sm={12} lg={24 / items.length}>
            <Card
              bordered={false}
              className="stat-card"
              hoverable
              // --- CẬP NHẬT Ở ĐÂY ---
              // 1. Gán sự kiện click
              onClick={item.onClick}
              // 2. Gán style để hiện Border và Cursor
              style={{
                ...item.style,
                cursor: item.onClick ? "pointer" : "default",
                transition: "all 0.2s", // Thêm chút hiệu ứng mượt khi đổi border
              }}
              // -----------------------
            >
              <Skeleton loading={loading} active paragraph={{ rows: 1 }} avatar>
                <div className="stat-content">
                  <div className="stat-info">
                    <Text type="secondary" className="stat-title">
                      {item.title}
                    </Text>
                    <Title
                      level={2}
                      className="stat-value"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </Title>

                    {/* Render Trend nếu có */}
                    {item.trend && (
                      <div
                        className={`stat-trend ${item.trend > 0 ? "trend-up" : "trend-down"}`}
                      >
                        {item.trend > 0 ? (
                          <ArrowUpOutlined />
                        ) : (
                          <ArrowDownOutlined />
                        )}
                        <span>{Math.abs(item.trend)}% so với tháng trước</span>
                      </div>
                    )}
                  </div>

                  {/* Icon có background màu */}
                  <div
                    className="stat-icon-wrapper"
                    style={{
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
              </Skeleton>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default StatsSection;
