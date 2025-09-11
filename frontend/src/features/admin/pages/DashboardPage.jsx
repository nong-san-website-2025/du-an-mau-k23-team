// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, Statistic, Table, Typography } from "antd";
import {
  UserOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import RevenueChart from "../components/Dashboard/RevenueChart";
import OrderPieChart from "../components/Dashboard/OrderPieChart";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

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
    { title: t("dashboard.top_products.name"), dataIndex: "name", key: "name" },
    { title: t("dashboard.top_products.sales"), dataIndex: "sales", key: "sales" },
  ];

  const topSellersColumns = [
    {
      title: t("dashboard.top_sellers.seller"),
      dataIndex: "product__seller__store_name",
      key: "seller",
    },
    {
      title: t("dashboard.top_sellers.revenue"),
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => `${value.toLocaleString()} ₫`,
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2}>{t("Dashboard")}</Title>
      </Row>

      {/* Cards tổng quan */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("dashboard.cards.total_users")}
              value={data.total_users}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("dashboard.cards.sellers")}
              value={data.total_sellers}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("dashboard.cards.customers")}
              value={data.total_customers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("dashboard.cards.total_products")}
              value={data.total_products}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("dashboard.cards.total_orders")}
              value={data.total_orders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t("dashboard.cards.revenue")}
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
          <Card title={t("dashboard.charts.revenue_by_month")}>
            <RevenueChart data={data.revenue_by_month} />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title={t("dashboard.charts.orders_by_status")}>
            <OrderPieChart data={data.orders_by_status} />
          </Card>
        </Col>
      </Row>

      {/* Bảng sản phẩm bán chạy */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title={t("Top Products")}>
            <Table
              dataSource={data.top_products || []}
              columns={topProductsColumns}
              rowKey={(record) => record.name}
              pagination={false}
              locale={{ emptyText: t("no_data") }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng top seller */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title={t("Top Sellers")}>
            <Table
              dataSource={data.top_sellers || []}
              columns={topSellersColumns}
              rowKey={(record) => record.product__seller__id}
              pagination={false}
              locale={{ emptyText: t("no_data") }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}