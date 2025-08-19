// pages/ShopAdmin/ShopOrdersPage.jsx
import React, { useState } from "react";
import { Search } from "lucide-react";
import OrderTable from "../TableShop/OrderTable";

const MOCK_ORDERS = [
  { id: "GF-101", customer: "John Doe", total: 250000, status: "pending", date: "2025-08-17" },
  { id: "GF-102", customer: "Jane Smith", total: 400000, status: "completed", date: "2025-08-16" },
  { id: "GF-103", customer: "Nguyễn An", total: 180000, status: "processing", date: "2025-08-16" },
  { id: "GF-104", customer: "Trần Bình", total: 120000, status: "canceled", date: "2025-08-15" },
];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [checkedIds, setCheckedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  return (
    <div className="container-fluid mt-3">
      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="input-group">
            <Search size={16} style={{position: "absolute", top: "30px", zIndex: 11, left: "10px"}} />
            <input
              className="form-control"
              placeholder="Tìm theo mã đơn/khách hàng…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} style={{height: "20px", width: "400px", padding: "17px 35px", border: "1px solid #ccc", marginTop: "20px", position: "relative"}}
            />
          </div>
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <div className="text-muted small">
          Đang chọn: <b>{checkedIds.length}</b>
        </div>
      </div>

      {/* Table */}
      <OrderTable
        orders={orders}
        setOrders={setOrders}
        loading={false}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        checkedIds={checkedIds}
        setCheckedIds={setCheckedIds}
      />
    </div>
  );
}
