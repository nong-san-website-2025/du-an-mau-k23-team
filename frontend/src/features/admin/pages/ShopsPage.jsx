// src/features/admin/pages/ShopsPage.jsx
import React, { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import AdminPageLayout from "../components/AdminPageLayout";
import AdminHeader from "../components/AdminHeader";
import ShopSideBar from "../components/UserAdmin/UserSidebar"; // hoặc tạo ShopSidebar riêng
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function ShopsPage() {
  const [sellers, setSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const [triggerAddShop, setTriggerAddShop] = useState(false);
  const [addData, setAddData] = useState({
    store_name: "",
    bio: "",
    address: "",
    phone: "",
    image: null,
    user: "",
  });
  const [addPreview, setAddPreview] = useState(null);

  const [editSeller, setEditSeller] = useState(null);
  const [editData, setEditData] = useState({
    store_name: "",
    bio: "",
    address: "",
    phone: "",
    image: null,
    user: "",
  });
  const [editPreview, setEditPreview] = useState(null);

  // fetch sellers
  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:8000/api/sellers/",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSellers(res.data);
    } catch (err) {
      console.error(err);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch users
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchSellers();
    fetchUsers();
  }, []);

  // Delete multiple sellers
  const handleDeleteSelected = async () => {
    if (checkedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn xoá ${checkedIds.length} cửa hàng?`))
      return;

    try {
      for (const id of checkedIds) {
        await axios.delete(`http://localhost:8000/api/sellers/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      setSellers((prev) => prev.filter((s) => !checkedIds.includes(s.id)));
      setCheckedIds([]);
      alert("Đã xoá thành công!");
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại!");
    }
  };

  // Add seller
  const handleAddShop = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("store_name", addData.store_name);
      formData.append("bio", addData.bio);
      formData.append("address", addData.address);
      formData.append("phone", addData.phone);
      formData.append("user", addData.user);
      if (addData.image) formData.append("image", addData.image);

      const res = await axios.post(
        "http://localhost:8000/api/sellers",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSellers([...sellers, res.data]);
      setTriggerAddShop(false);
      setAddData({
        store_name: "",
        bio: "",
        address: "",
        phone: "",
        image: null,
        user: "",
      });
      setAddPreview(null);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  // Edit seller
  const handleEditClick = (seller) => {
    setEditSeller(seller);
    setEditData({
      store_name: seller.store_name,
      bio: seller.bio || "",
      address: seller.address || "",
      phone: seller.phone || "",
      image: null,
      user: seller.user,
    });
    setEditPreview(seller.image || null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("store_name", editData.store_name);
      formData.append("bio", editData.bio);
      formData.append("address", editData.address);
      formData.append("phone", editData.phone);
      formData.append("user", editData.user);
      if (editData.image) formData.append("image", editData.image);

      const res = await axios.put(
        `http://localhost:8000/api/sellers/${editSeller.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSellers(sellers.map((s) => (s.id === editSeller.id ? res.data : s)));
      setEditSeller(null);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const filteredSellers = sellers.filter(
    (s) =>
      s.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>⏳ Đang tải danh sách cửa hàng...</p>;

  return (
    <AdminPageLayout
      header={<AdminHeader />}
      sidebar={
        <ShopSideBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roles={[]} // tránh undefined
        />
      }
    >
      <div className="bg-white" style={{ minHeight: "100vh" }}>
        {/* Toolbar */}
        <div className="p-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-0 gap-2 flex-wrap">
            <div style={{ flex: 1 }}>
              <div className="input-group" style={{ width: 420 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    top: "30px",
                    zIndex: 11,
                    left: "10px",
                  }}
                />
                <input
                  className="form-control"
                  placeholder="Tìm kiếm cửa hàng"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    height: "20px",
                    width: "400px",
                    padding: "17px 35px",
                    border: "1px solid #ccc",
                    marginTop: "20px",
                    position: "relative",
                    borderRadius: "8px",
                  }}
                />
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
              {checkedIds.length > 0 ? (
                <button
                  className="btn btn-danger border"
                  onClick={handleDeleteSelected}
                >
                  Xoá ({checkedIds.length})
                </button>
              ) : (
                <button
                  className="btn"
                  style={{
                    backgroundColor: "#22C55E",
                    color: "#fff",
                    fontWeight: "600",
                  }}
                  onClick={() => setTriggerAddShop(true)}
                >
                  <Plus size={20} className="me-2" /> Thêm cửa hàng
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-1">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Tên cửa hàng</th>
                <th>Mô tả</th>
                <th>Chủ Shop</th>
                <th>Địa chỉ</th>
                <th>SĐT</th>
                <th>Ngày tạo</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">
                    Không có cửa hàng
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller, idx) => (
                  <tr key={seller.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(seller.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setCheckedIds([...checkedIds, seller.id]);
                          else
                            setCheckedIds(
                              checkedIds.filter((id) => id !== seller.id)
                            );
                        }}
                      />
                    </td>
                    <td>{seller.store_name}</td>
                    <td>{seller.bio || "—"}</td>
                    <td>{seller.owner_username || "—"}</td>
                    <td>{seller.address || "—"}</td>
                    <td>{seller.phone || "—"}</td>
                    <td>{new Date(seller.created_at).toLocaleDateString()}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEditClick(seller)}
                      >
                        <FaEdit />
                      </button>
                      {/* <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteSelected([seller.id])}
                      >
                        <FaTrash />
                      </button> */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Add */}
        {triggerAddShop && (
          <div
            className="modal fade show d-flex align-items-center justify-content-center"
            style={{ display: "flex", background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content p-4">
                <h5 className="fw-bold mb-3">Thêm cửa hàng</h5>
                <form onSubmit={handleAddShop}>
                  <div className="mb-3">
                    <label>Chủ shop</label>
                    <select
                      className="form-select"
                      required
                      value={addData.user}
                      onChange={(e) =>
                        setAddData({ ...addData, user: Number(e.target.value) })
                      }
                    >
                      <option value="">-- Chọn user --</option>
                      {users
                        .filter((u) => !sellers.some((s) => s.user === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label>Tên cửa hàng</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addData.store_name}
                      onChange={(e) =>
                        setAddData({ ...addData, store_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Mô tả</label>
                    <textarea
                      className="form-control"
                      value={addData.bio}
                      onChange={(e) =>
                        setAddData({ ...addData, bio: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addData.address}
                      onChange={(e) =>
                        setAddData({ ...addData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>SĐT</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addData.phone}
                      onChange={(e) =>
                        setAddData({ ...addData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Ảnh</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => {
                        setAddData({ ...addData, image: e.target.files[0] });
                        setAddPreview(URL.createObjectURL(e.target.files[0]));
                      }}
                    />
                    {addPreview && (
                      <img
                        src={addPreview}
                        width={120}
                        style={{ borderRadius: 8, marginTop: 10 }}
                      />
                    )}
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setTriggerAddShop(false)}
                    >
                      Huỷ
                    </button>
                    <button type="submit" className="btn btn-success">
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit */}
        {editSeller && (
          <div
            className="modal fade show d-flex align-items-center justify-content-center"
            style={{ display: "flex", background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content p-4">
                <h5 className="fw-bold mb-3">Sửa cửa hàng</h5>
                <form onSubmit={handleSaveEdit}>
                  <div className="mb-3">
                    <label>Chủ shop</label>
                    <select
                      className="form-select"
                      required
                      value={editData.user}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          user: Number(e.target.value),
                        })
                      }
                    >
                      <option value="">-- Chọn user --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label>Tên cửa hàng</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.store_name}
                      onChange={(e) =>
                        setEditData({ ...editData, store_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Mô tả</label>
                    <textarea
                      className="form-control"
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData({ ...editData, bio: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.address}
                      onChange={(e) =>
                        setEditData({ ...editData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>SĐT</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Ảnh</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => {
                        setEditData({ ...editData, image: e.target.files[0] });
                        setEditPreview(URL.createObjectURL(e.target.files[0]));
                      }}
                    />
                    {editPreview && (
                      <img
                        src={editPreview}
                        width={120}
                        style={{ borderRadius: 8, marginTop: 10 }}
                      />
                    )}
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditSeller(null)}
                      style={{ marginRight: "10px" }}
                    >
                      Huỷ
                    </button>
                    <button type="submit" className="btn btn-success">
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
