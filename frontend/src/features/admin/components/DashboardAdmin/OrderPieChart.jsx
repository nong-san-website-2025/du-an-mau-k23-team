import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 1. Map màu sắc cố định (Key tiếng Anh)
const STATUS_COLORS = {
  pending: "#FFBB28",
  processing: "#1890ff",
  shipping: "#0088FE",
  ready_to_pick: "#AA46BE",
  picking: "#FF8042",
  completed: "#4CAF50",
  delivered: "#1E90FF",
  cancelled: "#FF4D4F",
  returned: "#708090", // Màu xám xanh cho hàng trả về
};

// 2. Map tên hiển thị tiếng Việt (Bổ sung Returned ở đây)
const STATUS_LABELS = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipping: "Đang giao hàng",
  ready_to_pick: "Chờ lấy hàng",
  picking: "Đang lấy hàng",
  completed: "Thành công",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
  returned: "Đã trả hàng", // ✅ Đã thêm tiếng Việt
};

export default function OrderPieChart({ data = [] }) {
  console.log("📊 OrderPieChart received data:", data);
  
  const chartData = data.map((item) => {
    // Ưu tiên lấy 'status' sau đó mới đến 'sta' để tránh lỗi dữ liệu từ backend
    const statusKey = item.status || item.sta || item.status_name;

    return {
      // Nếu không tìm thấy trong từ điển LABELS thì giữ nguyên tên gốc
      name: STATUS_LABELS[statusKey] || statusKey || "Không xác định",
      originalKey: statusKey,
      value: item.count || 0,
    };
  });
  
  console.log("📊 OrderPieChart processed chartData:", chartData);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={5}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.originalKey] || "#999999"}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} đơn hàng`, name]}
          contentStyle={{
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
