import React from "react";
import { Card } from "antd";
import { Line } from "@ant-design/charts";

export default function Analytics() {
  const data = [
    { date: "2025-08-20", sales: 50000 },
    { date: "2025-08-21", sales: 80000 },
    { date: "2025-08-22", sales: 40000 },
    { date: "2025-08-23", sales: 90000 },
  ];

  const config = {
    data,
    xField: 'date',
    yField: 'sales',
    smooth: true,
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Thống kê doanh thu</h2>
      <Card>
        <Line {...config} />
      </Card>
    </div>
  );
}
