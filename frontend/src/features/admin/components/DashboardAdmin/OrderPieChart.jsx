import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Map màu cố định cho từng trạng thái
const STATUS_COLORS = {
  pending: "#FFBB28",       
  processing: "#000000ff",    
  shipping: "#0088FE",     
  ready_to_pick: "#AA46BE", 
  picking: "#FF8042",
  success: "#4CAF50",       
  delivered: "#1E90FF",     
  cancelled: "#FF0000",     
  refunded: "#8B4513",      
};

export default function OrderPieChart({ data = [] }) {
  const chartData = data.map((item) => ({
    name: item.sta,   // giữ nguyên sta từ backend
    value: item.count,
  }));


  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.name] || "#999"} // fallback xám nhạt
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} đơn`, name]}
          labelFormatter={(label) => `${label}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
