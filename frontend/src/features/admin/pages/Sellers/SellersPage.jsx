import { useEffect, useState } from "react";
import { Search, HelpCircle, CheckCircle2 } from "lucide-react";
import AdminPageLayout from "../../components/AdminPageLayout";
import { approveSeller, rejectSeller } from "../../../sellers/services/sellerService";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL;

export default function SellersPage() {
  const { t } = useTranslation();
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
      const res = await fetch(`${API_URL}/sellers/`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setSellers(data);
    } catch (err) {
      console.error("❌ Lỗi khi fetch sellers:", err);
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
      alert(t("sellers_page.approve_failed") + ": " + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectSeller(id);
      fetchSellers();
    } catch (err) {
      alert(t("sellers_page.reject_failed") + ": " + err.message);
    }
  };

  const renderActionButtons = () => {
    if (checkedIds.length > 0) {
      return (
        <button
          className="btn btn-success border"
          style={{ fontWeight: "500" }}
          title={t("sellers_page.bulk_approve")}
          onClick={() => {
            if (
              window.confirm(
                t("sellers_page.confirm_bulk_approve", { count: checkedIds.length })
              )
            ) {
              // TODO: Gọi API duyệt nhiều cửa hàng
              alert(t("sellers_page.bulk_approved") + ": " + checkedIds.join(", "));
            }
          }}
        >
          <CheckCircle2 size={16} style={{ marginRight: 6 }} />
          {t("sellers_page.approve")} ({checkedIds.length})
        </button>
      );
    }
    return (
      <button
        className="btn btn-light border"
        style={{ fontWeight: "500", color: "#48474b" }}
      >
        <HelpCircle size={16} />
      </button>
    );
  };

  return (
    <AdminPageLayout sidebar={null}>
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
                  placeholder={t("sellers_page.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
              {checkedIds.length > 0 && (
                <span className="badge bg-primary" style={{ fontSize: 14, fontWeight: 500 }}>
                  {t("sellers_page.selected")}: {checkedIds.length}
                </span>
              )}
              {renderActionButtons()}
            </div>
          </div>
        </div>

        {/* Sellers Table */}
        <div className="p-1">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={checkedIds.length === sellers.length && sellers.length > 0}
                    onChange={(e) =>
                      setCheckedIds(e.target.checked ? sellers.map((s) => s.id) : [])
                    }
                  />
                </th>
                <th>{t("sellers_page.shop_name")}</th>
                <th>{t("sellers_page.owner")}</th>
                <th>{t("sellers_page.address")}</th>
                <th>{t("sellers_page.phone")}</th>
                <th>{t("sellers_page.created_at")}</th>
                <th>{t("sellers_page.status")}</th>
                <th>{t("sellers_page.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>{t("users_page.table.loading")}</td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan={8}>{t("users_page.table.no_data")}</td>
                </tr>
              ) : (
                sellers
                  .filter((s) =>
                    s.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((seller) => (
                    <tr key={seller.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={checkedIds.includes(seller.id)}
                          onChange={(e) =>
                            setCheckedIds(
                              e.target.checked
                                ? [...checkedIds, seller.id]
                                : checkedIds.filter((id) => id !== seller.id)
                            )
                          }
                        />
                      </td>
                      <td>{seller.store_name}</td>
                      <td>{seller.owner_name || seller.user_name}</td>
                      <td>{seller.address}</td>
                      <td>{seller.phone}</td>
                      <td>{seller.created_at}</td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (seller.status === "approved"
                              ? "bg-success"
                              : seller.status === "pending"
                              ? "bg-warning"
                              : "bg-secondary")
                          }
                        >
                          {t(`sellers_page.${seller.status || "pending"}`)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {/* Approve */}
                          <button
                            className="btn btn-success btn-sm d-flex align-items-center gap-1 px-3 py-1 shadow"
                            style={{ borderRadius: 6, fontWeight: 600, fontSize: 15 }}
                            onClick={() => handleApprove(seller.id)}
                            disabled={seller.status === "approved"}
                            title={t("sellers_page.approve")}
                          >
                            <CheckCircle2 size={18} />
                            <span>
                              {seller.status === "approved"
                                ? t("sellers_page.approved")
                                : t("sellers_page.approve")}
                            </span>
                          </button>

                          {/* Reject */}
                          <button
                            className="btn btn-danger btn-sm d-flex align-items-center gap-1 px-3 py-1 shadow"
                            style={{ borderRadius: 6, fontWeight: 600, fontSize: 15 }}
                            onClick={() => handleReject(seller.id)}
                            disabled={seller.status === "rejected"}
                            title={t("sellers_page.reject")}
                          >
                            <span style={{ fontWeight: 700 }}>
                              {seller.status === "rejected"
                                ? t("sellers_page.rejected")
                                : t("sellers_page.reject")}
                            </span>
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
              {t("sellers_page.showing", { count: sellers.length })}
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
