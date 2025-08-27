import { useEffect, useState } from "react";
import { Search, Check, X } from "lucide-react";
import axios from "axios";
import AdminPageLayout from "../components/AdminPageLayout";
import { Spinner } from "react-bootstrap";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // lấy từ .env
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function SupportPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  function formatMoney(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US");
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "Đã duyệt";
      case "pending":
        return "Đang chờ";
      case "rejected":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin_wallet_requests/", {
        headers: getAuthHeaders(),
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    await api.post(
      `/admin_wallet_requests/${id}/approve/`,
      {},
      { headers: getAuthHeaders() }
    );
    alert("Đã duyệt!");
    fetchRequests();
  };

  const reject = async (id) => {
    await api.post(
      `/admin_wallet_requests/${id}/reject/`,
      {},
      { headers: getAuthHeaders() }
    );
    alert("Đã từ chối!");
    fetchRequests();
  };

  const filteredRequests = requests.filter((r) =>
    r.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-pill text-white fw-bold";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-success`;
      case "pending":
        return `${baseClasses} bg-warning`;
      case "rejected":
        return `${baseClasses} bg-danger`;
      default:
        return `${baseClasses} bg-secondary`;
    }
  };

  return (
    <AdminPageLayout>
      <div className="bg-white" style={{ minHeight: "100vh" }}>
        <div className="p-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <div style={{ flex: 1 }}>
              <div className="input-group" style={{ width: 420 }}>
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm kiếm theo tên người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="d-flex justify-content-center p-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.user}</td>
                      <td>{formatMoney(r.amount)} đ</td>
                      <td>
                        <span className={getStatusBadge(r.status)}>
                          {getStatusLabel(r.status)}
                        </span>
                      </td>
                      <td>
                        {r.status === "pending" && (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => approve(r.id)}
                            >
                              <Check size={16} /> Duyệt
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => reject(r.id)}
                            >
                              <X size={16} /> Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center">
                      Không có yêu cầu nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
