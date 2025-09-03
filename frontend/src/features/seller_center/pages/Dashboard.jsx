import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { ShoppingCartOutlined, DollarOutlined, UserOutlined, AppstoreOutlined } from "@ant-design/icons";

export default function Dashboard() {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Tổng quan</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="Đơn mới" value={12} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Doanh thu" value={1500000} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Khách hàng mới" value={25} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Sản phẩm bán chạy" value={8} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
