import React from "react";
import { Row, Col, Card, Typography, Skeleton } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import "./StatsSection.css";

const { Title, Text } = Typography;

const StatsSection = ({ items = [], loading = false }) => {
  return (
    <div className="common-stats-section">
      <Row gutter={[16, 16]}>
        {items.map((item, index) => {
          // Kiểm tra xem thẻ này có đang được chọn không
          const isActive = item.active; 

          return (
            <Col key={index} xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                className="stat-card"
                hoverable
                onClick={item.onClick}
                style={{
                  ...item.style,
                  cursor: item.onClick ? "pointer" : "default",
                  transition: "all 0.3s ease",
                  // Hiệu ứng Visual khi được chọn: Viền xanh + Nền hơi xanh nhẹ
                  border: isActive ? `1px solid ${item.color}` : "1px solid transparent",
                  backgroundColor: isActive ? "#f6ffed" : "#fff", // Màu xanh nhạt của GreenFarm theme
                  transform: isActive ? "translateY(-2px)" : "none",
                  boxShadow: isActive ? "0 4px 12px rgba(40, 167, 69, 0.15)" : "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <Skeleton loading={loading} active paragraph={{ rows: 1 }} avatar>
                  <div className="stat-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div className="stat-info">
                      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                        {item.title}
                      </Text>
                      <Title
                        level={2}
                        style={{ 
                          margin: "4px 0 0", 
                          color: isActive ? item.color : "#262626", // Đổi màu chữ khi active
                          fontSize: 28 
                        }}
                      >
                        {item.value}
                      </Title>
                    </div>

                    {/* Icon nằm trong khối tròn */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        backgroundColor: isActive ? item.color : `${item.color}15`, // Active thì đậm, ko thì nhạt
                        color: isActive ? "#fff" : item.color,
                        transition: "all 0.3s"
                      }}
                    >
                      {item.icon}
                    </div>
                  </div>
                </Skeleton>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default StatsSection;