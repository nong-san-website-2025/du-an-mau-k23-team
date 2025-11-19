// src/features/admin/pages/reports/ReportOrdersPage.jsx

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Space,
  Divider,
  Spin,
  Alert,
} from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
} from "@ant-design/icons";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import AdminPageLayout from "../../components/AdminPageLayout";
import { fetchWithAuth } from "../../services/userApi";

const COLORS = ["#36A2EB", "#FFB347", "#4CAF50", "#FF6B6B"];
const API_BASE_URL = "http://localhost:8000/api";

// Default empty state
const defaultOrderSummary = {
  totalOrders: 0,
  revenue: 0,
  onTimeRate: 0,
  cancelRate: 0,
};

// Columns for Shipping Table
const columns = [
  {
    title: "Đơn vị giao hàng",
    dataIndex: "name",
  },
  {
    title: "Chi phí (VNĐ)",
    dataIndex: "cost",
    render: (val) => val.toLocaleString() + " đ",
  },
];

// Component
export default function ReportOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSummary, setOrderSummary] = useState(defaultOrderSummary);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [deliveryTimeData, setDeliveryTimeData] = useState([]);
  const [shippingCostData, setShippingCostData] = useState([]);

  useEffect(() => {
    fetchOrderStatistics();
  }, []);

  const fetchOrderStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchWithAuth(
        `${API_BASE_URL}/orders/admin/order-statistics/`
      );

      setOrderSummary(data.orderSummary || defaultOrderSummary);
      setOrderStatusData(data.orderStatusData || []);
      setDeliveryTimeData(data.deliveryTimeData || []);
      setShippingCostData(data.shippingCostData || []);
    } catch (err) {
      console.error("Error fetching order statistics:", err);
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="BÁO CÁO ĐƠN HÀNG">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="BÁO CÁO ĐƠN HÀNG">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        {error && (
          <Alert
            message="Lỗi"
            description={`Không thể tải dữ liệu: ${error}`}
            type="error"
            showIcon
            closable
          />
        )}

        {/* TOP SUMMARY CARDS */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng đơn hàng"
                value={orderSummary.totalOrders}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={orderSummary.revenue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#3f8600" }}
                formatter={(value) =>
                  `${(value / 1000000).toFixed(1)}M`
                }
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card>
              <Statistic
                title="Tỷ lệ giao đúng hẹn"
                value={orderSummary.onTimeRate}
                suffix="%"
                valueStyle={{ color: "#4CAF50" }}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card>
              <Statistic
                title="Tỷ lệ hủy"
                value={orderSummary.cancelRate}
                suffix="%"
                valueStyle={{ color: "#FF6B6B" }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Order Status PieChart */}
        {orderStatusData.length > 0 && (
          <Card title="Trạng thái đơn hàng">
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Delivery Performance */}
        {deliveryTimeData.length > 0 && (
          <Card title="⏱ Hiệu suất giao hàng">
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <BarChart data={deliveryTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />

                  <Bar
                    yAxisId="left"
                    dataKey="avg"
                    name="TG giao trung bình (ngày)"
                    fill="#36A2EB"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="late"
                    name="Tỷ lệ giao trễ (%)"
                    fill="#FF6B6B"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Shipping Cost Table */}
        {shippingCostData.length > 0 && (
          <Card title="🚚 Chi phí vận chuyển theo đơn vị giao hàng">
            <Table
              columns={columns}
              dataSource={shippingCostData}
              pagination={false}
              rowKey="name"
            />
          </Card>
        )}
      </Space>
    </AdminPageLayout>
  );
}
