// src/features/admin/pages/ShopAdmin/ShopProductsPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../../services/products";
import ProductAddEditModal from "./ProductAddEditModal";

export default function ShopProductsPage() {
  const [products, setProducts] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    getProducts().then((data) => setProducts(data));
  }, []);

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.category_name ?? "").toLowerCase().includes(s)
    );
  }, [products, searchTerm]);

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (prod) => { setEditing(prod); setShowModal(true); };

  const onSave = async (item) => {
    try {
      if (item.id) {
        const updated = await updateProduct(item.id, item);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await addProduct(item);
        setProducts((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      alert("Không lưu được sản phẩm.");
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Xoá sản phẩm "${prod.name}"?`)) return;
    await deleteProduct(prod.id);
    setProducts((prev) => prev.filter((p) => p.id !== prod.id));
  };

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between mb-2">
        <h4 className="m-0">Sản phẩm</h4>
        <div className="d-flex" style={{ gap: 8 }}>
          <input className="form-control" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{height: "", width: "500px"}} />
          <button className="btn btn-success" onClick={openAdd} style={{height: "", width: "200px"}}>+ Thêm sản phẩm</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th></th>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-muted">Không có sản phẩm</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input type="checkbox" className="form-check-input"
                      checked={checkedIds.includes(p.id)}
                      onChange={(e) =>
                        setCheckedIds(e.target.checked
                          ? [...checkedIds, p.id]
                          : checkedIds.filter((id) => id !== p.id))
                      }
                    />
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <img src={p.image || "https://via.placeholder.com/40x40.png?text=No+Img"} alt="img"
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", marginRight: 12 }} />
                      <div>
                        <div className="fw-bold">{p.name}</div>
                        <small className="text-muted">#{p.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>{p.category_name}</td>
                  <td>{Number(p.price).toLocaleString()} đ</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-2" onClick={() => openEdit(p)}>Sửa</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p)}>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductAddEditModal show={showModal} onClose={() => setShowModal(false)} onSave={onSave} editing={editing} />
    </div>
  );
}
