// src/pages/TableShop/ReportCharts.jsx
import React from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

export default function ReportCharts({ reports = [], topProducts = [] }) {
  const labels = reports.map((r) => r.date);

  const revenueData = {
    labels,
    datasets: [
      {
        label: "Doanh thu (đ)",
        data: reports.map((r) => r.revenue),
        borderColor: "#198754",
        backgroundColor: "rgba(25,135,84,0.3)",
        fill: true,
      },
    ],
  };

  const productData = {
    labels: topProducts.map((p) => p.name),
    datasets: [
      {
        label: "Số lượng bán",
        data: topProducts.map((p) => p.sold),
        backgroundColor: "rgba(13,110,253,0.6)",
      },
    ],
  };

  return (
    <div className="row g-3">
      <div className="col-md-8">
        <div className="card p-3">
          <h6 className="fw-bold">Biểu đồ doanh thu</h6>
          <Line data={revenueData} />
        </div>
      </div>
      <div className="col-md-4">
        <div className="card p-3">
          <h6 className="fw-bold">Top sản phẩm bán chạy</h6>
          <Bar data={productData} />
        </div>
      </div>
    </div>
  );
}
