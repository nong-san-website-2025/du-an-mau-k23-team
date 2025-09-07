import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, Statistic, Table, Typography } from "antd";
import {
  UserOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import RevenueChart from "../components/RevenueChart";
import OrderPieChart from "../components/OrderPieChart";

const { Title } = Typography;

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://127.0.0.1:8000/api/dashboard/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(response.data);
      } catch (err) {
        console.error("Dashboard API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Error loading data</div>;

  const topProductsColumns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "name", // phải khớp với alias trong views.py
      key: "name",
    },
    {
      title: "Số lượng bán",
      dataIndex: "sales",
      key: "sales",
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* Cards tổng quan */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số người dùng"
              value={data.total_users}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số sản phẩm"
              value={data.total_products}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số đơn hàng"
              value={data.total_orders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={data.total_revenue}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={14}>
          <Card title="Doanh thu theo tháng">
            <RevenueChart />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title="Tỷ lệ đơn hàng">
            <OrderPieChart />
          </Card>
        </Col>
      </Row>

      {/* Bảng sản phẩm bán chạy */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Sản phẩm bán chạy">
            <Table
              dataSource={data.top_products || []}
              columns={topProductsColumns}
              rowKey={(record) => record.name}
              pagination={false}
              locale={{ emptyText: "Không có dữ liệu" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
