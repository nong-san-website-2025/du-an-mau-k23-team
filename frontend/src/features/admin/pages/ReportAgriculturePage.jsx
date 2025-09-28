import React, { useState } from "react";
import { DatePicker, Select, Card, Table, Tag } from "antd";
import {
  ShopOutlined,
  DollarCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportAgriculturePage = () => {
  const [filter, setFilter] = useState("month");

  // Dữ liệu demo
  const suppliersData = [
    { name: "HTX Lúa Gạo Cần Thơ", revenue: 15000000, cancelRate: 2, delayRate: 3 },
    { name: "Trang trại Rau Đà Lạt", revenue: 12000000, cancelRate: 1, delayRate: 5 },
    { name: "Nông trại Xoài Đồng Tháp", revenue: 8000000, cancelRate: 4, delayRate: 2 },
    { name: "Hợp tác xã Cà phê Buôn Ma Thuột", revenue: 20000000, cancelRate: 3, delayRate: 4 },
  ];

  const columns = [
    {
      title: "Nhà cung cấp",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Doanh thu (VNĐ)",
      dataIndex: "revenue",
      key: "revenue",
      render: (val) => val.toLocaleString(),
    },
    {
      title: "Tỷ lệ hủy đơn (%)",
      dataIndex: "cancelRate",
      key: "cancelRate",
      render: (val) => (
        <Tag color={val > 3 ? "red" : "green"}>{val}%</Tag>
      ),
    },
    {
      title: "Tỷ lệ giao chậm (%)",
      dataIndex: "delayRate",
      key: "delayRate",
      render: (val) => (
        <Tag color={val > 4 ? "orange" : "blue"}>{val}%</Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Bộ lọc */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <RangePicker />
        <Select value={filter} onChange={setFilter} style={{ width: 150 }}>
          <Option value="day">Theo ngày</Option>
          <Option value="month">Theo tháng</Option>
          <Option value="year">Theo năm</Option>
        </Select>
      </div>

      {/* Thống kê tổng quan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Card>
          <h3>
            <ShopOutlined style={{ color: "green" }} /> Nhà cung cấp hoạt động
          </h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>
            {suppliersData.length}
          </p>
        </Card>
        <Card>
          <h3>
            <DollarCircleOutlined style={{ color: "blue" }} /> Tổng doanh thu
          </h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>
            {suppliersData
              .reduce((sum, s) => sum + s.revenue, 0)
              .toLocaleString()}{" "}
            đ
          </p>
        </Card>
        <Card>
          <h3>
            <WarningOutlined style={{ color: "orange" }} /> Tỷ lệ hủy/giao chậm TB
          </h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>
            {(
              suppliersData.reduce(
                (sum, s) => sum + s.cancelRate + s.delayRate,
                0
              ) /
              (suppliersData.length * 2)
            ).toFixed(1)}
            %
          </p>
        </Card>
      </div>

      {/* Biểu đồ doanh thu theo nhà cung cấp */}
      <Card style={{ marginBottom: 20 }}>
        <h3>📊 Doanh thu theo nhà cung cấp</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={suppliersData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#4ade80" name="Doanh thu" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bảng chi tiết */}
      <Card>
        <h3>📋 Chi tiết nhà cung cấp</h3>
        <Table
          columns={columns}
          dataSource={suppliersData}
          rowKey="name"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default ReportAgriculturePage;
