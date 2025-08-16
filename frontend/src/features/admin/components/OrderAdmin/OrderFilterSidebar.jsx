import React from "react";

export default function OrderFilterSidebar({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  statusOptions,
}) {
  return (
    <div className="bg-white p-3 rounded shadow-sm border mb-3">
      <h5 className="fw-bold mb-4">Đơn hàng</h5>
      
      <div className="mb-3">
        <label className="form-label fw-bold" style={{ fontSize: "14px" }}>
          Trạng thái
        </label>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold" style={{ fontSize: "14px" }}>
          Tìm kiếm
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="Tên khách hàng hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
}