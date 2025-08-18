// src/pages/ShopAdmin/ShopWalletPage.jsx
import React, { useState } from "react";
import { Search } from "lucide-react";
import WalletTable from "../TableShop/WalletTable";

const MOCK_TRANSACTIONS = [
  { id: "TXN-001", type: "in", amount: 500000, description: "Nạp từ Momo", date: "2025-08-15" },
  { id: "TXN-002", type: "out", amount: 200000, description: "Thanh toán đơn #GF-101", date: "2025-08-16" },
  { id: "TXN-003", type: "in", amount: 1000000, description: "Nạp từ Vietcombank", date: "2025-08-16" },
  { id: "TXN-004", type: "out", amount: 150000, description: "Hoàn tiền khách", date: "2025-08-17" },
];

export default function ShopWalletPage() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [checkedIds, setCheckedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  return (
    <div className="container-fluid mt-3">
      {/* Balance summary */}
      <div className="mb-3 p-3 border rounded bg-light">
        <h5>Số dư ví: <span className="text-success">{(transactions.reduce((acc, t) => acc + (t.type === "in" ? t.amount : -t.amount), 0)).toLocaleString()} đ</span></h5>
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="input-group">
            <Search size={16} style={{position: "absolute", top: "30px", zIndex: 11, left: "10px"}} />
            <input
                className="form-control"
                placeholder="Tìm theo mã GD hoặc mô tả…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} style={{height: "20px", width: "400px", padding: "17px 35px", border: "1px solid #ccc", marginTop: "20px", position: "relative"}}
            />
          </div>
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="in">Nạp</option>
            <option value="out">Chi</option>
          </select>
        </div>

        <div className="text-muted small">
          Đang chọn: <b>{checkedIds.length}</b>
        </div>
      </div>

      {/* Table */}
      <WalletTable
        transactions={transactions}
        setTransactions={setTransactions}
        loading={false}
        searchTerm={searchTerm}
        selectedType={selectedType}
        checkedIds={checkedIds}
        setCheckedIds={setCheckedIds}
      />
    </div>
  );
}
