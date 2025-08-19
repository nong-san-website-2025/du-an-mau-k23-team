// src/pages/ShopAdmin/ShopVouchersPage.jsx
import React, { useState } from "react";
import { Search } from "lucide-react";
import VoucherTable from "../TableShop/VoucherTable";

const MOCK_VOUCHERS = [
  { id: 1, code: "SALE10", title: "Giảm 10%", type: "%", value: "10%", end: "2025-08-30", status: "active" },
  { id: 2, code: "FREESHIP", title: "Miễn phí vận chuyển", type: "ship", value: "Free", end: "2025-08-20", status: "expired" },
  { id: 3, code: "NEWUSER", title: "Ưu đãi khách mới", type: "amount", value: "50.000đ", end: "2025-09-10", status: "upcoming" },
];

export default function ShopVouchersPage() {
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);
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
                placeholder="Tìm theo mã/ tiêu đề theo đơn…"
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
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="upcoming">Sắp diễn ra</option>
          </select>
        </div>

        <div className="text-muted small">
          Đang chọn: <b>{checkedIds.length}</b>
        </div>
      </div>

      {/* Table */}
      <VoucherTable
        vouchers={vouchers}
        setVouchers={setVouchers}
        loading={false}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        checkedIds={checkedIds}
        setCheckedIds={setCheckedIds}
      />
    </div>
  );
}
