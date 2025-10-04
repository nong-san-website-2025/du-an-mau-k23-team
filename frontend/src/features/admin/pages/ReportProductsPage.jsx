// src/features/admin/pages/reports/ReportProductsPage.jsx
import React, { useState, useEffect } from "react";
import { Card, Table, Statistic, Row, Col, Tag, message } from "antd";
import {
  ShoppingOutlined,
  WarningOutlined,
  FrownOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import api from "../../../features/login_register/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReportProductsPage() {
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stats, setStats] = useState({
    topCount: 0,
    lowStockCount: 0,
    complaintRate: 0,
  });

  const loadData = async () => {
    try {
      // Lấy danh sách sản phẩm
      const res = await api.get("/products/");
      const data = Array.isArray(res.data) ? res.data : [];

      // 1. Top sản phẩm bán chạy
      const sortedBySold = [...data].sort((a, b) => b.sold - a.sold);
      const top5 = sortedBySold.slice(0, 5);

      // 2. Sản phẩm sắp hết hàng
      const low = data.filter((p) => p.stock <= 10);

      // 3. Tính tỷ lệ khiếu nại / trả hàng
      let complaintRate = 0;
      if (data.length > 0) {
        const complaints = data.reduce(
          (sum, p) => sum + (p.complaints || 0),
          0
        );
        const sold = data.reduce((sum, p) => sum + (p.sold || 0), 0);
        complaintRate = sold > 0 ? ((complaints / sold) * 100).toFixed(2) : 0;
      }

      setTopProducts(top5);
      setLowStock(low);
      setStats({
        topCount: top5.length,
        lowStockCount: low.length,
        complaintRate,
      });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu sản phẩm");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columnsTop = [
    { title: "Sản phẩm", dataIndex: "name", key: "name" },
    { title: "Đã bán", dataIndex: "sold", key: "sold" },
    { title: "Tồn kho", dataIndex: "stock", key: "stock" },
  ];

  const columnsLow = [
    { title: "Sản phẩm", dataIndex: "name", key: "name" },
    { title: "Tồn kho", dataIndex: "stock", key: "stock" },
    {
      title: "Trạng thái",
      render: (_, record) =>
        record.stock === 0 ? (
          <Tag color="red">Hết hàng</Tag>
        ) : (
          <Tag color="orange">Sắp hết</Tag>
        ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Thống kê nhanh */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Top sản phẩm bán chạy"
              value={stats.topCount}
              prefix={<TrophyOutlined style={{ color: "gold" }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Sản phẩm sắp hết hàng"
              value={stats.lowStockCount}
              prefix={<WarningOutlined style={{ color: "orange" }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tỷ lệ khiếu nại / trả hàng"
              value={stats.complaintRate}
              suffix="%"
              prefix={<FrownOutlined style={{ color: "red" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Top sản phẩm bán chạy */}
      <Card title="Top sản phẩm bán chạy">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sold" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
        <Table
          columns={columnsTop}
          dataSource={topProducts}
          rowKey="id"
          pagination={false}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Sản phẩm tồn kho thấp */}
      <Card title="Sản phẩm tồn kho / sắp hết hàng">
        <Table
          columns={columnsLow}
          dataSource={lowStock}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
