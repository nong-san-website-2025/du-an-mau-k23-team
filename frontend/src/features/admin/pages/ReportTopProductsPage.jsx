// src/features/admin/pages/reports/ReportTopProductsPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Table, Row, Col, Statistic, message } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ShoppingCartOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../../features/login_register/services/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

export default function ReportTopProductsPage() {
  const [orders, setOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [segmentData, setSegmentData] = useState([]);
  const [retentionRate, setRetentionRate] = useState(0);
  const [avgCLV, setAvgCLV] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAdmin = localStorage.getItem("is_admin") === "true";
      const endpoint = isAdmin ? "/orders/admin-list/" : "/orders/";
      const res = await api.get(endpoint);
      const ordersData = Array.isArray(res.data) ? res.data : [];
      setOrders(ordersData);

      // === Xử lý Top sản phẩm ===
      const productCount = {};
      ordersData.forEach((o) => {
        if (o.status === "success" && o.items) {
          o.items.forEach((item) => {
            if (!item.product) return;
            const name = item.product.name;
            const qty = item.quantity || 0;
            productCount[name] = (productCount[name] || 0) + qty;
          });
        }
      });
      const topProductsArr = Object.entries(productCount)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
      setTopProducts(topProductsArr);

      // === Xử lý Top nhà cung cấp ===
      const supplierCount = {};
      ordersData.forEach((o) => {
        if (o.status === "success" && o.items) {
          o.items.forEach((item) => {
            if (!item.product || !item.product.supplier) return;
            const sup = item.product.supplier;
            const qty = item.quantity || 0;
            supplierCount[sup] = (supplierCount[sup] || 0) + qty;
          });
        }
      });
      const topSuppliersArr = Object.entries(supplierCount)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
      setTopSuppliers(topSuppliersArr);

      // === Khách hàng mới vs quay lại ===
      const userOrderCount = new Map();
      ordersData.forEach((o) => {
        if (o.user) {
          userOrderCount.set(o.user, (userOrderCount.get(o.user) || 0) + 1);
        }
      });
      let newCustomers = 0,
        returningCustomers = 0;
      userOrderCount.forEach((count) => {
        if (count > 1) returningCustomers++;
        else newCustomers++;
      });
      setCustomerData([
        { name: "Khách mới", value: newCustomers },
        { name: "Khách quay lại", value: returningCustomers },
      ]);

      // === Tính retention rate ===
      const totalCustomers = userOrderCount.size;
      const returning = returningCustomers;
      const retention = totalCustomers > 0 ? ((returning / totalCustomers) * 100).toFixed(1) : 0;
      setRetentionRate(retention);

      // === Tính CLV trung bình ===
      const spendByUser = new Map();
      ordersData.forEach((o) => {
        if (o.status === "success") {
          const key = o.user ?? o.user_email ?? `user-${o.id}`;
          const spent = Number(o.total_price || 0);
          spendByUser.set(key, (spendByUser.get(key) || 0) + spent);
        }
      });
      const avg =
        spendByUser.size > 0
          ? (Array.from(spendByUser.values()).reduce((a, b) => a + b, 0) / spendByUser.size).toFixed(0)
          : 0;
      setAvgCLV(avg);

      // === Phân khúc khách hàng ===
      const seg = { VIP: 0, Frequent: 0, New: 0 };
      spendByUser.forEach((spent, userKey) => {
        const ordersCount = userOrderCount.get(userKey) || 0;
        if (spent >= 5000000) {
          seg.VIP++;
        } else if (ordersCount >= 5) {
          seg.Frequent++;
        } else {
          seg.New++;
        }
      });
      setSegmentData([
        { name: "VIP", value: seg.VIP },
        { name: "Thường xuyên", value: seg.Frequent },
        { name: "Khách mới", value: seg.New },
      ]);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu báo cáo");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tỷ lệ khách quay lại"
              value={retentionRate}
              suffix="%"
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="CLV trung bình"
              value={Number(avgCLV).toLocaleString()}
              suffix="đ"
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={customerData.reduce((a, b) => a + b.value, 0)}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Khách hàng mới vs quay lại">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {customerData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Phân khúc khách hàng">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Top sản phẩm bán chạy">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="qty" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top nhà cung cấp">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSuppliers}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="qty" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
