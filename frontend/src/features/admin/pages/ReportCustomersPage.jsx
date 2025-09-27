import React, { useState } from "react";
import { DatePicker, Select, Card } from "antd";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { UserAddOutlined, UserSwitchOutlined, TeamOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportCustomersPage = () => {
  const [filter, setFilter] = useState("day");

  // Dữ liệu demo
  const trendData = [
    { date: "2025-09-20", newCustomers: 12, returningCustomers: 8 },
    { date: "2025-09-21", newCustomers: 20, returningCustomers: 15 },
    { date: "2025-09-22", newCustomers: 18, returningCustomers: 12 },
    { date: "2025-09-23", newCustomers: 25, returningCustomers: 19 },
    { date: "2025-09-24", newCustomers: 30, returningCustomers: 20 },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Bộ lọc thời gian */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <RangePicker />
        <Select value={filter} onChange={setFilter} style={{ width: 150 }}>
          <Option value="day">Theo ngày</Option>
          <Option value="month">Theo tháng</Option>
          <Option value="year">Theo năm</Option>
        </Select>
      </div>

      {/* Các thẻ thống kê */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 20 }}>
        <Card>
          <h3><UserAddOutlined style={{ color: "green" }} /> Khách hàng mới</h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>120</p>
        </Card>
        <Card>
          <h3><UserSwitchOutlined style={{ color: "blue" }} /> Khách quay lại</h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>80</p>
        </Card>
        <Card>
          <h3><TeamOutlined style={{ color: "purple" }} /> Tổng khách hàng</h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>200</p>
        </Card>
      </div>

      {/* Biểu đồ xu hướng */}
      <Card>
        <h3>📈 Xu hướng khách hàng</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="newCustomers" stroke="#4ade80" strokeWidth={3} name="Khách mới" />
            <Line type="monotone" dataKey="returningCustomers" stroke="#60a5fa" strokeWidth={3} name="Khách quay lại" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ReportCustomersPage;
