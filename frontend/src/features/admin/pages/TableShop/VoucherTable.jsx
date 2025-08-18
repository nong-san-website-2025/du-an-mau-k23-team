// src/pages/TableShop/VoucherTable.jsx
import React, { useMemo } from "react";

export default function VoucherTable({
  vouchers = [],
  setVouchers,
  loading = false,
  searchTerm = "",
  selectedStatus = "all",
  checkedIds = [],
  setCheckedIds,
  VoucherTableActions,
}) {
  // --- Utils ---
  const norm = (v) => (v ?? "").toString().normalize("NFC").toLowerCase().trim();
  const sameId = (a, b) => String(a ?? "") === String(b ?? "");

  // --- Filter ---
  const filteredVouchers = useMemo(() => {
    const s = norm(searchTerm);
    const st = selectedStatus === "all" || selectedStatus === "" ? null : String(selectedStatus);

    return (Array.isArray(vouchers) ? vouchers : []).filter((v) => {
      const hitSearch = s === "" || norm(v.code).includes(s) || norm(v.title).includes(s);
      const hitStatus = !st || sameId(st, v.status);
      return hitSearch && hitStatus;
    });
  }, [vouchers, searchTerm, selectedStatus]);

  // --- Check all ---
  const toggleCheckAll = (checked) => {
    const visibleIds = filteredVouchers.map((v) => v?.id).filter(Boolean);
    if (checked) {
      const set = new Set([...checkedIds, ...visibleIds]);
      setCheckedIds(Array.from(set));
    } else {
      setCheckedIds(checkedIds.filter((id) => !visibleIds.includes(id)));
    }
  };

  // --- Check one ---
  const toggleCheckOne = (id, checked) => {
    if (!id) return;
    if (checked) setCheckedIds([...checkedIds, id]);
    else setCheckedIds(checkedIds.filter((x) => x !== id));
  };

  const isAllVisibleChecked =
    filteredVouchers.length > 0 && filteredVouchers.every((v) => checkedIds.includes(v.id));

  // --- Badge ---
  const StatusBadge = ({ value }) => {
    if (value === "active") return <span className="badge bg-success">Đang hoạt động</span>;
    if (value === "expired") return <span className="badge bg-danger">Hết hạn</span>;
    if (value === "upcoming") return <span className="badge bg-warning text-dark">Sắp diễn ra</span>;
    return <span className="badge bg-secondary">—</span>;
  };

  return (
    <div className="table-responsive" style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <table className="table table-hover mb-0">
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th
              className="border-0 py-0"
              style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}
            >
              <input
                type="checkbox"
                className="form-check-input"
                checked={isAllVisibleChecked}
                onChange={(e) => toggleCheckAll(e.target.checked)}
              />
            </th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Mã</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Tiêu đề</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Loại</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Giá trị</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Hạn dùng</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Trạng thái</th>
            <th className="border-0 py-0 text-muted" style={{ position: "sticky", top: 0, background: "#fff" }}>
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="text-center text-muted">Đang tải dữ liệu...</td></tr>
          ) : vouchers.length === 0 ? (
            <tr><td colSpan={8} className="text-center text-muted">Không có voucher</td></tr>
          ) : filteredVouchers.length === 0 ? (
            <tr><td colSpan={8} className="text-center text-muted">Không có voucher phù hợp</td></tr>
          ) : (
            filteredVouchers.map((v) => (
              <tr key={v.id}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={checkedIds.includes(v.id)}
                    onChange={(e) => toggleCheckOne(v.id, e.target.checked)}
                  />
                </td>
                <td className="fw-semibold">{v.code}</td>
                <td>{v.title}</td>
                <td>{v.type}</td>
                <td>{v.value}</td>
                <td>{v.end}</td>
                <td><StatusBadge value={v.status} /></td>
                <td className="text-nowrap">
                  {VoucherTableActions ? (
                    <VoucherTableActions voucher={v} />
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => alert(`Chi tiết voucher ${v.code}`)}
                    >
                      Chi tiết
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
