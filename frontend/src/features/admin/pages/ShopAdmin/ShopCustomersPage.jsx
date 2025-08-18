// src/pages/ShopAdmin/ShopCustomersPage.jsx
import React, { useState } from "react";
import { Search } from "lucide-react";
import CustomerTable from "../TableShop/CustomerTable";

const MOCK_CUSTOMERS = [
  { id: 1, name: "John Doe", email: "john@example.com", phone: "0901000111", orders: 5 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "0902000222", orders: 3 },
  { id: 3, name: "Nguyễn An", email: "an@greenfarm.vn", phone: "0903000333", orders: 12 },
];

export default function ShopCustomersPage() {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [checkedIds, setCheckedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="container-fluid mt-3">
      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="input-group" style={{ maxWidth: 360 }}>
          <Search size={16} style={{position: "absolute", top: "30px", zIndex: 11, left: "10px"}} />
          <input
            className="form-control"
            placeholder="Tìm tên/email/điện thoại…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} style={{height: "20px", width: "400px", padding: "17px 35px", border: "1px solid #ccc", marginTop: "20px", position: "relative"}}
          />
        </div>

        <div className="text-muted small">
          Đang chọn: <b>{checkedIds.length}</b>
        </div>
      </div>

      {/* Table */}
      <CustomerTable
        customers={customers}
        setCustomers={setCustomers}
        loading={false}
        searchTerm={searchTerm}
        checkedIds={checkedIds}
        setCheckedIds={setCheckedIds}
      />
    </div>
  );
}
