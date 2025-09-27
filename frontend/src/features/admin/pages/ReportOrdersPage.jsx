import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Dữ liệu mẫu
const orderStatusData = [
  { name: "Chờ xử lý", value: 120 },
  { name: "Đang giao", value: 80 },
  { name: "Hoàn tất", value: 300 },
];

const deliveryTimeData = [
  { name: "Tháng 7", avg: 2.1, late: 15 },
  { name: "Tháng 8", avg: 2.5, late: 20 },
  { name: "Tháng 9", avg: 1.8, late: 10 },
];

const shippingCostData = [
  { name: "GHN", cost: 1200000 },
  { name: "GHTK", cost: 1500000 },
  { name: "Viettel Post", cost: 900000 },
  { name: "J&T", cost: 1100000 },
];

const COLORS = ["#FFB347", "#36A2EB", "#4CAF50"];

const ReportOrdersPage = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">📦 Báo cáo Đơn hàng</h2>

      {/* Trạng thái đơn hàng */}
      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">Trạng thái đơn hàng</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {orderStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Thời gian giao hàng */}
      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">
          ⏱️ Thời gian giao hàng trung bình & tỷ lệ giao trễ
        </h3>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={deliveryTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Bar
                yAxisId="left"
                dataKey="avg"
                fill="#8884d8"
                name="Thời gian (ngày)"
              />
              <Bar
                yAxisId="right"
                dataKey="late"
                fill="#82ca9d"
                name="Tỷ lệ trễ (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chi phí vận chuyển */}
      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">
          🚚 Chi phí vận chuyển theo đơn vị giao hàng
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Đơn vị giao hàng</th>
                <th className="px-4 py-2 border">Chi phí (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {shippingCostData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{row.name}</td>
                  <td className="px-4 py-2 border">
                    {row.cost.toLocaleString()} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportOrdersPage;
