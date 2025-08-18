// src/pages/ShopAdmin/ShopReportsPage.jsx
import React, { useState } from "react";
import ReportTable from "../TableShop/ReportTable";
import ReportCharts from "../TableShop/ReportChart";

const MOCK_REPORTS = [
  { date: "2025-08-12", orders: 12, revenue: 2500000, newCustomers: 3 },
  { date: "2025-08-13", orders: 8, revenue: 1500000, newCustomers: 1 },
  { date: "2025-08-14", orders: 15, revenue: 3000000, newCustomers: 4 },
  { date: "2025-08-15", orders: 20, revenue: 5000000, newCustomers: 6 },
  { date: "2025-08-16", orders: 10, revenue: 1800000, newCustomers: 2 },
];

const MOCK_TOP_PRODUCTS = [
  { name: "Rau cải xanh", sold: 120 },
  { name: "Cà chua", sold: 95 },
  { name: "Thịt gà", sold: 80 },
  { name: "Trứng gà ta", sold: 65 },
];

export default function ShopReportsPage() {
  const [reports] = useState(MOCK_REPORTS);
  const [topProducts] = useState(MOCK_TOP_PRODUCTS);

  return (
    <div className="container-fluid mt-3">
      <h5 className="mb-3 fw-bold">Báo cáo kinh doanh</h5>

      {/* Charts */}
      <ReportCharts reports={reports} topProducts={topProducts} />

      {/* Table */}
      <div className="card mt-3 p-3">
        <h6 className="fw-bold">Chi tiết từng ngày</h6>
        <ReportTable reports={reports} />
      </div>
    </div>
  );
}
