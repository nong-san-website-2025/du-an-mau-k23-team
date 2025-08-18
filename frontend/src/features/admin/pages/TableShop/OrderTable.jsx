// components/ShopAdmin/OrderTable.jsx
import React, { useMemo } from "react";

export default function OrderTable({
  orders = [],
  setOrders,
  loading = false,
  searchTerm = "",
  selectedStatus = "all",
  checkedIds = [],
  setCheckedIds,
  OrderTableActions,
}) {
  // --- Utils ---
  const norm = (v) => (v ?? "").toString().normalize("NFC").toLowerCase().trim();
  const sameId = (a, b) => String(a ?? "") === String(b ?? "");

  // --- Filter ---
  const filteredOrders = useMemo(() => {
    const s = norm(searchTerm);
    const st = selectedStatus === "all" || selectedStatus === "" ? null : String(selectedStatus);

    return (Array.isArray(orders) ? orders : []).filter((o) => {
      const hitSearch = s === "" || norm(o.id).includes(s) || norm(o.customer).includes(s);
      const hitStatus = !st || sameId(st, o.status);
      return hitSearch && hitStatus;
    });
  }, [orders, searchTerm, selectedStatus]);

  // --- Check all ---
  const toggleCheckAll = (checked) => {
    const visibleIds = filteredOrders.map((o) => o?.id).filter(Boolean);
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
    filteredOrders.length > 0 && filteredOrders.every((o) => checkedIds.includes(o.id));

  const StatusBadge = ({ value }) => {
    if (value === "pending") return <span className="badge bg-warning text-dark">Pending</span>;
    if (value === "processing") return <span className="badge bg-info text-dark">Processing</span>;
    if (value === "completed") return <span className="badge bg-success">Completed</span>;
    if (value === "canceled") return <span className="badge bg-danger">Canceled</span>;
    return <span className="badge bg-secondary">—</span>;
  };

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
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Mã đơn</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Khách hàng</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Tổng tiền</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Trạng thái</th>
            <th className="border-0 py-0" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Ngày</th>
            <th className="border-0 py-0 text-muted" style={{ position: "sticky", top: 0, background: "#fff", height: 26 }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="text-center text-muted">Đang tải dữ liệu...</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={7} className="text-center text-muted">Không có đơn</td></tr>
          ) : filteredOrders.length === 0 ? (
            <tr><td colSpan={7} className="text-center text-muted">Không có đơn phù hợp</td></tr>
          ) : (
            filteredOrders.map((o) => (
              <tr key={o.id}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={checkedIds.includes(o.id)}
                    onChange={(e) => toggleCheckOne(o.id, e.target.checked)}
                  />
                </td>
                <td className="fw-semibold">{o.id}</td>
                <td>{o.customer}</td>
                <td>{o.total.toLocaleString()} đ</td>
                <td><StatusBadge value={o.status} /></td>
                <td>{o.date}</td>
                <td className="text-nowrap">
                  {OrderTableActions ? (
                    <OrderTableActions order={o} />
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => alert(`Chi tiết đơn ${o.id}`)}
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
