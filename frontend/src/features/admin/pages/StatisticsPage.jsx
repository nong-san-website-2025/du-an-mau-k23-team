import React from "react";
import { Card, Table } from "antd";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Leaf, ShoppingBag, Users } from "lucide-react"; // icon hiện đại

// Giả lập dữ liệu nông sản
const revenueData = [
  { name: "Jan", revenue: 1200 },
  { name: "Feb", revenue: 2100 },
  { name: "Mar", revenue: 1800 },
  { name: "Apr", revenue: 2600 },
  { name: "May", revenue: 3200 },
];

const topProducts = [
  { key: 1, name: "Gạo hữu cơ", sales: 320 },
  { key: 2, name: "Rau sạch Đà Lạt", sales: 280 },
  { key: 3, name: "Trái cây sấy khô", sales: 190 },
];

const topSellers = [
  { key: 1, seller: "Nông trại A", revenue: 8500 },
  { key: 2, seller: "HTX B", revenue: 7200 },
  { key: 3, seller: "Trang trại C", revenue: 6100 },
];

const userAnalysis = [
  { name: "Khách hàng mới", value: 45 },
  { name: "Khách hàng quay lại", value: 55 },
];
const COLORS = ["#2ecc71", "#27ae60"]; // xanh lá hiện đại

export default function StatisticsPage() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Doanh thu */}
      <Card title="🌱 Doanh thu theo tháng" className="shadow-lg rounded-2xl">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#2ecc71" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top sản phẩm */}
      <Card title="🥦 Top sản phẩm bán chạy" className="shadow-lg rounded-2xl">
        <Table
          dataSource={topProducts}
          columns={[
            { title: "Sản phẩm", dataIndex: "name", key: "name" },
            { title: "Số lượng bán", dataIndex: "sales", key: "sales" },
          ]}
          pagination={false}
        />
      </Card>

      {/* Top Seller */}
      <Card title="🏆 Top Nhà cung cấp" className="shadow-lg rounded-2xl">
        <Table
          dataSource={topSellers}
          columns={[
            { title: "Nhà cung cấp", dataIndex: "seller", key: "seller" },
            { title: "Doanh thu (VNĐ)", dataIndex: "revenue", key: "revenue" },
          ]}
          pagination={false}
        />
      </Card>

      {/* Phân tích khách hàng */}
      <Card title="👥 Phân tích khách hàng" className="shadow-lg rounded-2xl">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={userAnalysis}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#2ecc71"
              dataKey="value"
              label
            >
              {userAnalysis.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
