// src/pages/TableShop/WalletTable.jsx
import React, { useMemo } from "react";

export default function WalletTable({
  transactions = [],
  setTransactions,
  loading = false,
  searchTerm = "",
  selectedType = "all", // all | in | out
  checkedIds = [],
  setCheckedIds,
  WalletTableActions,
}) {
  // --- Utils ---
  const norm = (v) => (v ?? "").toString().normalize("NFC").toLowerCase().trim();

  // --- Filter ---
  const filteredTxns = useMemo(() => {
    const s = norm(searchTerm);
    const type = selectedType === "all" || selectedType === "" ? null : selectedType;

    return (Array.isArray(transactions) ? transactions : []).filter((t) => {
      const hitSearch =
        s === "" ||
        norm(t.id).includes(s) ||
        norm(t.description).includes(s);
      const hitType = !type || t.type === type;
      return hitSearch && hitType;
    });
  }, [transactions, searchTerm, selectedType]);

  // --- Check all ---
  const toggleCheckAll = (checked) => {
    const visibleIds = filteredTxns.map((t) => t?.id).filter(Boolean);
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
    filteredTxns.length > 0 && filteredTxns.every((t) => checkedIds.includes(t.id));

  const TypeBadge = ({ value }) => {
    if (value === "in") return <span className="badge bg-success">Nạp</span>;
    if (value === "out") return <span className="badge bg-danger">Chi</span>;
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
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Mã GD</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Loại</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Số tiền</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Mô tả</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff" }}>Ngày</th>
            <th className="border-0 py-0 text-muted" style={{ position: "sticky", top: 0, background: "#fff" }}>
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="text-center text-muted">Đang tải dữ liệu...</td></tr>
          ) : transactions.length === 0 ? (
            <tr><td colSpan={7} className="text-center text-muted">Không có giao dịch</td></tr>
          ) : filteredTxns.length === 0 ? (
            <tr><td colSpan={7} className="text-center text-muted">Không có giao dịch phù hợp</td></tr>
          ) : (
            filteredTxns.map((t) => (
              <tr key={t.id}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={checkedIds.includes(t.id)}
                    onChange={(e) => toggleCheckOne(t.id, e.target.checked)}
                  />
                </td>
                <td className="fw-semibold">{t.id}</td>
                <td><TypeBadge value={t.type} /></td>
                <td>{t.amount.toLocaleString()} đ</td>
                <td>{t.description}</td>
                <td>{t.date}</td>
                <td className="text-nowrap">
                  {WalletTableActions ? (
                    <WalletTableActions transaction={t} />
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => alert(`Chi tiết GD ${t.id}`)}
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
