// components/ShopAdmin/CustomerTable.jsx
import React, { useMemo } from "react";
import { User } from "lucide-react";

export default function CustomerTable({
  customers = [],
  setCustomers,
  loading = false,
  searchTerm = "",
  checkedIds = [],
  setCheckedIds,
  CustomerTableActions,
}) {
  // --- Utils ---
  const norm = (v) => (v ?? "").toString().normalize("NFC").toLowerCase().trim();

  // --- Filter ---
  const filteredCustomers = useMemo(() => {
    const s = norm(searchTerm);
    return (Array.isArray(customers) ? customers : []).filter((c) => {
      return (
        s === "" ||
        norm(c.name).includes(s) ||
        norm(c.email).includes(s) ||
        norm(c.phone).includes(s)
      );
    });
  }, [customers, searchTerm]);

  // --- Check all ---
  const toggleCheckAll = (checked) => {
    const visibleIds = filteredCustomers.map((c) => c?.id).filter(Boolean);
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
    filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => checkedIds.includes(c.id));

  return (
    <div className="table-responsive" style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <table className="table table-hover mb-0">
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={isAllVisibleChecked}
                onChange={(e) => toggleCheckAll(e.target.checked)}
              />
            </th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26, paddingLeft: 60 }}>
              Khách hàng
            </th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Email</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Điện thoại</th>
            <th className="border-0 py-0 text-muted" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="text-center text-muted">Đang tải dữ liệu...</td></tr>
          ) : customers.length === 0 ? (
            <tr><td colSpan={5} className="text-center text-muted">Không có khách</td></tr>
          ) : filteredCustomers.length === 0 ? (
            <tr><td colSpan={5} className="text-center text-muted">Không có khách phù hợp</td></tr>
          ) : (
            filteredCustomers.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={checkedIds.includes(c.id)}
                    onChange={(e) => toggleCheckOne(c.id, e.target.checked)}
                  />
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="me-2 rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div className="fw-semibold">{c.name}</div>
                      <small className="badge bg-secondary">{c.orders} đơn</small>
                    </div>
                  </div>
                </td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td className="text-nowrap">
                  {CustomerTableActions ? (
                    <CustomerTableActions customer={c} />
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => alert(`Chi tiết khách ${c.name}`)}
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
