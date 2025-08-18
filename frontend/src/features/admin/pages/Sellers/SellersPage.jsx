import { useEffect, useState } from "react";
import { Search, HelpCircle, CheckCircle2 } from "lucide-react";
import AdminPageLayout from "../../components/AdminPageLayout";
import AdminHeader from "../../components/AdminHeader";
import { approveSeller, rejectSeller } from "../../../sellers/services/sellerService";
// Bạn có thể tạo SellerFilterSidebar, SellerTable, SellerTableActions tương tự như Product* nếu muốn tách riêng

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedIds, setCheckedIds] = useState([]);

  useEffect(() => {
    fetchSellers();
    // eslint-disable-next-line
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sellers/");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setSellers(data);
    } catch (err) {
      console.error("Lỗi khi fetch sellers:", err);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveSeller(id);
      fetchSellers();
    } catch (err) {
      alert("Duyệt thất bại: " + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectSeller(id);
      fetchSellers();
    } catch (err) {
      alert("Từ chối thất bại: " + err.message);
    }
  };

  const renderActionButtons = () => {
    if (checkedIds.length > 0) {
      return (
        <button
          className="btn btn-success border"
          style={{ fontWeight: "500" }}
          title="Duyệt các cửa hàng đã chọn"
          onClick={() => {
            if (
              window.confirm(
                `Bạn có chắc muốn duyệt ${checkedIds.length} cửa hàng đã chọn?`
              )
            ) {
              // TODO: Gọi API duyệt nhiều cửa hàng với checkedIds
              alert("Đã gọi duyệt các cửa hàng: " + checkedIds.join(", "));
            }
          }}
        >
          <CheckCircle2 size={16} style={{ marginRight: 6 }} />
          Duyệt ({checkedIds.length})
        </button>
      );
    }
    return (
      <>
        <button className="btn btn-light border" style={{ fontWeight: "500", color: "#48474b" }}>
          <HelpCircle size={16} />
        </button>
      </>
    );
  };

  return (
    <AdminPageLayout
      header={<AdminHeader />}
      sidebar={null}
    >
      <div className="bg-white" style={{ minHeight: "100vh" }}>
        {/* Header Section */}
        <div className="p-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-0 gap-2 flex-wrap">
            {/* Thanh tìm kiếm */}
            <div style={{ flex: 1 }}>
              <div className="input-group" style={{ width: 420 }}>
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm kiếm cửa hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Action buttons */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
              {checkedIds.length > 0 && (
                <span
                  className="badge bg-primary"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  Đã chọn: {checkedIds.length}
                </span>
              )}
              {renderActionButtons()}
            </div>
          </div>
        </div>

        {/* Sellers Table */}
        <div className="p-1">
          {/* TODO: SellerTable component, tạm thời render bảng đơn giản */}
          <table className="table table-hover">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={checkedIds.length === sellers.length && sellers.length > 0}
                    onChange={e => {
                      setCheckedIds(e.target.checked ? sellers.map(s => s.id) : []);
                    }}
                  />
                </th>
                <th>Tên cửa hàng</th>
                <th>Chủ cửa hàng</th>
                <th>Địa chỉ</th>
                <th>Điện thoại</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}>Đang tải...</td></tr>
              ) : sellers.length === 0 ? (
                <tr><td colSpan={8}>Không có cửa hàng nào</td></tr>
              ) : (
                sellers.filter(s => s.store_name.toLowerCase().includes(searchTerm.toLowerCase())).map(seller => (
                  <tr key={seller.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(seller.id)}
                        onChange={e => {
                          setCheckedIds(e.target.checked ? [...checkedIds, seller.id] : checkedIds.filter(id => id !== seller.id));
                        }}
                      />
                    </td>
                    <td>{seller.store_name}</td>
                    <td>{seller.owner_name || seller.user_name}</td>
                    <td>{seller.address}</td>
                    <td>{seller.phone}</td>
                    <td>{seller.created_at}</td>
                    <td>
                      <span className={"badge " + (seller.status === "Đã duyệt" ? "bg-success" : seller.status === "Chờ duyệt" ? "bg-warning" : "bg-secondary")}>{seller.status || "Chờ duyệt"}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className={
                            "btn btn-success btn-sm d-flex align-items-center gap-1 px-3 py-1 shadow " +
                            (seller.status === "approved" ? "disabled" : "")
                          }
                          style={{ borderRadius: 6, fontWeight: 600, fontSize: 15, boxShadow: seller.status !== "approved" ? "0 2px 8px #22c55e33" : "none", opacity: seller.status === "approved" ? 0.6 : 1, cursor: seller.status === "approved" ? "not-allowed" : "pointer" }}
                          onClick={() => handleApprove(seller.id)}
                          disabled={seller.status === "approved"}
                          title={seller.status === "approved" ? "Đã duyệt" : "Duyệt cửa hàng này"}
                        >
                          <CheckCircle2 size={18} />
                          <span>{seller.status === "approved" ? "Đã duyệt" : "Duyệt"}</span>
                        </button>
                        <button
                          className={
                            "btn btn-danger btn-sm d-flex align-items-center gap-1 px-3 py-1 shadow " +
                            (seller.status === "rejected" ? "disabled" : "")
                          }
                          style={{ borderRadius: 6, fontWeight: 600, fontSize: 15, boxShadow: seller.status !== "rejected" ? "0 2px 8px #ef444433" : "none", opacity: seller.status === "rejected" ? 0.6 : 1, cursor: seller.status === "rejected" ? "not-allowed" : "pointer" }}
                          onClick={() => handleReject(seller.id)}
                          disabled={seller.status === "rejected"}
                          title={seller.status === "rejected" ? "Đã từ chối" : "Từ chối cửa hàng này"}
                        >
                          <span style={{ fontWeight: 700 }}>Từ chối</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
              Hiển thị {sellers.length} cửa hàng
            </div>
            {/* TODO: Pagination component riêng */}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}