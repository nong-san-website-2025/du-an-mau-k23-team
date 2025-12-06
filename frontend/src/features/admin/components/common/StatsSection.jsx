import React from "react";
import { Row, Col, Card, Statistic, Skeleton } from "antd";

const StatsSection = ({ items = [], loading = false }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={16}>
        {items.map((item, index) => (
          <Col key={index} xs={24} sm={12} lg={6}>
            <Card bordered={false} className="statistic-card">
              <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                <Statistic
                  title={item.title}
                  value={item.value}
                  prefix={item.icon}
                  valueStyle={item.style || { fontSize: 24 }}
                  precision={item.precision || 0}
                />
              </Skeleton>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default StatsSection;
