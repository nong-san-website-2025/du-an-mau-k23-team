import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RevenueChart({ data = [] }) {
  // Hàm chuyển đổi nhãn từ Backend (nếu là tiếng Anh) sang Tiếng Việt
  const formatMonth = (month) => {
    const months = {
      Jan: "Tháng 1",
      Feb: "Tháng 2",
      Mar: "Tháng 3",
      Apr: "Tháng 4",
      May: "Tháng 5",
      Jun: "Tháng 6",
      Jul: "Tháng 7",
      Aug: "Tháng 8",
      Sep: "Tháng 9",
      Oct: "Tháng 10",
      Nov: "Tháng 11",
      Dec: "Tháng 12",
    };
    return months[month] || month;
  };

  // Dữ liệu hiển thị
  const chartData =
    data && data.length > 0
      ? data.map((item) => ({ ...item, month: formatMonth(item.month) }))
      : [
          { month: "Tháng 1", revenue: 1200000 },
          { month: "Tháng 2", revenue: 2100000 },
          { month: "Tháng 3", revenue: 1800000 },
          { month: "Tháng 4", revenue: 2500000 },
          { month: "Tháng 5", revenue: 3200000 },
          { month: "Tháng 6", revenue: 2800000 },
          { month: "Tháng 7", revenue: 3000000 },
          { month: "Tháng 8", revenue: 2700000 },
          { month: "Tháng 9", revenue: 3100000 },
          { month: "Tháng 10", revenue: 2900000 },
          { month: "Tháng 11", revenue: 3300000 },
          { month: "Tháng 12", revenue: 2600000 },
        ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 0 }} // Tăng left một chút để không mất số ở trục Y
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) =>
            value > 0 ? `${(value / 1000000).toFixed(0)}tr` : 0
          } // Hiển thị 1tr, 2tr cho gọn giống layout
        />
        <Tooltip
          formatter={(value) => [`${value.toLocaleString()} ₫`, "Doanh thu"]}
          labelStyle={{ fontWeight: "bold" }}
        />
        <Line
          type="monotone" // Giữ đường cong mượt mà như trong ảnh
          dataKey="revenue"
          stroke="#1890ff"
          strokeWidth={2}
          dot={{ r: 4 }} // Thêm điểm tròn nhỏ tại các mốc
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
