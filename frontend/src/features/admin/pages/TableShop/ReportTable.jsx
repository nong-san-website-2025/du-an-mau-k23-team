// src/pages/TableShop/ReportTable.jsx
import React from "react";

export default function ReportTable({ reports = [], loading = false }) {
  return (
    <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
      <table className="table table-hover mb-0">
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ position: "sticky", top: 0, background: "#fff" }}>Ngày</th>
            <th style={{ position: "sticky", top: 0, background: "#fff" }}>Số đơn</th>
            <th style={{ position: "sticky", top: 0, background: "#fff" }}>Doanh thu</th>
            <th style={{ position: "sticky", top: 0, background: "#fff" }}>Khách mới</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="text-center text-muted">Đang tải dữ liệu…</td></tr>
          ) : reports.length === 0 ? (
            <tr><td colSpan={4} className="text-center text-muted">Không có dữ liệu</td></tr>
          ) : (
            reports.map((r) => (
              <tr key={r.date}>
                <td>{r.date}</td>
                <td>{r.orders}</td>
                <td>{r.revenue.toLocaleString()} đ</td>
                <td>{r.newCustomers}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
