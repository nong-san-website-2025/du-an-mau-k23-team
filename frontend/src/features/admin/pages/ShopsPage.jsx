// src/features/admin/pages/ShopsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function ShopsPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editSeller, setEditSeller] = useState(null);
  const [newData, setNewData] = useState({ store_name: "", bio: "" });
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load danh sách sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/sellers/sellers/",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setSellers(res.data);
      } catch (err) {
        console.error(
          "❌ Lỗi load sellers:",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  // Xử lý xóa seller
  const handleDeleteSeller = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá cửa hàng này?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/sellers/sellers/${id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSellers(sellers.filter((s) => s.id !== id));
    } catch (err) {
      console.error("❌ Lỗi xoá store:", err.response?.data || err.message);
    }
  };

  // Xử lý mở modal sửa
  const handleEditClick = (seller) => {
    setEditSeller(seller);
    setNewData({ store_name: seller.store_name, bio: seller.bio });
  };

  // Lưu sửa
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `http://localhost:8000/api/sellers/sellers/${editSeller.id}/`,
        newData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSellers(sellers.map((s) => (s.id === editSeller.id ? res.data : s)));
      setEditSeller(null);
    } catch (err) {
      console.error("❌ Lỗi sửa store:", err.response?.data || err.message);
    }
  };

  // Lọc search
  const filteredSellers = sellers.filter(
    (s) =>
      s.store_name.toLowerCase().includes(search.toLowerCase()) ||
      s.bio?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSellers = filteredSellers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" }); // auto scroll lên đầu
    }
  };
  const getPaginationRange = (current, total) => {
    const delta = 2; // số trang hiển thị xung quanh
    const range = [];
    const rangeWithDots = [];

    let l;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };
  const paginationRange = getPaginationRange(currentPage, totalPages);

  if (loading) return <p>⏳ Đang tải danh sách cửa hàng...</p>;

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý cửa hàng</h4>
          <input
            type="text"
            className="form-control w-25"
            placeholder="🔍 Tìm kiếm cửa hàng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // reset về page 1 khi search
            }}
          />
        </div>
        <div className="card-body">
          {paginatedSellers.length === 0 ? (
            <p className="text-muted">Không tìm thấy cửa hàng nào.</p>
          ) : (
            <>
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Tên cửa hàng</th>
                    <th>Mô tả</th>
                    <th>Chủ Shop</th>
                    <th>Ngày tạo</th>
                    <th className="text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSellers.map((seller, index) => (
                    <tr key={seller.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{seller.store_name}</td>
                      <td>{seller.bio || "—"}</td>
                      <td>{seller.user_username || "—"}</td>
                      <td>
                        {new Date(seller.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => handleEditClick(seller)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleDeleteSeller(seller.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {/* Pagination đẹp như e-commerce */}
              {/* Pagination đẹp như e-commerce */}
              <nav className="d-flex justify-content-center mt-3">
                <ul className="pagination pagination-lg">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ padding: "5px 10px" }}
                    >
                      «
                    </button>
                  </li>

                  {paginationRange.map((page, idx) => (
                    <li
                      key={idx}
                      className={`page-item ${page === currentPage ? "active" : ""} ${
                        page === "..." ? "disabled" : ""
                      }`}
                    >
                      {page === "..." ? (
                        <span className="page-link">…</span>
                      ) : (
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page)}
                          style={{ padding: "5px 10px" }}
                        >
                          {page}
                        </button>
                      )}
                    </li>
                  ))}

                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{ padding: "5px 10px" }}
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </div>
      </div>

      {/* Modal sửa */}
      {editSeller && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 1050,
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{
              transform: "scale(1)",
              transition: "all 0.3s ease-in-out",
            }}
          >
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: "20px", overflow: "hidden" }}
            >
              {/* Header Gradient */}
              <div className="modal-header text-black">
                <h5 className="modal-title fw-bold">Chỉnh sửa cửa hàng</h5>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  {/* Input tên cửa hàng */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Tên cửa hàng
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg shadow-sm"
                      style={{
                        borderRadius: "12px",
                        border: "1px solid transparent",
                        background:
                          "linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #000000ff, #000000ff) border-box",
                      }}
                      value={newData.store_name}
                      onChange={(e) =>
                        setNewData({ ...newData, store_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Input mô tả */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Mô tả</label>
                    <textarea
                      className="form-control shadow-sm"
                      style={{
                        borderRadius: "12px",
                        border: "1px solid transparent",
                        background:
                          "linear-gradient(#fff, #fff) padding-box, linear-gradient(50deg, #000000ff, #000000ff) border-box",
                        minHeight: "50px",
                      }}
                      value={newData.bio}
                      onChange={(e) =>
                        setNewData({ ...newData, bio: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer border-0 p-3 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-light px-4 py-2 shadow-sm"
                    style={{ borderRadius: "12px" }}
                    onClick={() => setEditSeller(null)}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="btn px-4 py-2 shadow"
                    style={{
                      borderRadius: "12px",
                      // background: "linear-gradient(135deg, #00ff15ff 0%, #00ff15ff 100%)",
                      border: "none",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
