import React from "react";

const RECENT_ORDERS = [
  { id: "GF-105", customer: "Lê Mai", total: 220000, status: "completed", date: "2025-08-17" },
  { id: "GF-106", customer: "Phạm Sơn", total: 145000, status: "pending",   date: "2025-08-17" },
  { id: "GF-107", customer: "John Doe", total: 99000,  status: "processing", date: "2025-08-16" },
];

const LOW_STOCK = [
  { id: 2, name: "Chuối Laba", stock: 0 },
  { id: 4, name: "Bơ Đắk Lắk", stock: 12 },
];

const StatusBadge = ({ value }) => {
  if (value === "pending") return <span className="badge bg-warning text-dark">Pending</span>;
  if (value === "processing") return <span className="badge bg-info text-dark">Processing</span>;
  if (value === "completed") return <span className="badge bg-success">Completed</span>;
  return <span className="badge bg-secondary">—</span>;
};

export default function ShopDashboardPage() {
  return (
    <div className="container-fluid mt-3">
      {/* KPI Cards */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card p-3">
            <div className="text-muted small">Tổng sản phẩm</div>
            <div className="h4 m-0">120</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <div className="text-muted small">Tổng đơn</div>
            <div className="h4 m-0">45</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <div className="text-muted small">Khách hàng</div>
            <div className="h4 m-0">300</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <div className="text-muted small">Doanh thu hôm nay</div>
            <div className="h4 m-0">1.250.000 đ</div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Recent Orders */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header bg-white fw-semibold">Đơn gần đây</div>
            <div className="table-responsive" style={{ maxHeight: 360, overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Mã đơn</th>
                    <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Khách</th>
                    <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Tổng</th>
                    <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Trạng thái</th>
                    <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ORDERS.map((o) => (
                    <tr key={o.id}>
                      <td className="fw-semibold">{o.id}</td>
                      <td>{o.customer}</td>
                      <td>{o.total.toLocaleString()} đ</td>
                      <td><StatusBadge value={o.status} /></td>
                      <td>{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low stock */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header bg-white fw-semibold">Sắp hết hàng</div>
            <div className="table-responsive" style={{ maxHeight: 360, overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Sản phẩm</th>
                    <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {LOW_STOCK.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.name}</td>
                      <td>{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
