import React, { useState, useEffect } from "react";
import { productApi } from "../../../products/services/productApi";

const initialForm = {
  name: "",
  description: "",
  price: "",
  unit: "kg",
  stock: 0,
  image: null,
  category: "",
  subcategory: "",
  brand: "",
  location: "",
  discount: 0,
  is_new: false,
  is_organic: false,
  is_best_seller: false,
  seller: "",
};

const ProductAddModal = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      productApi.getCategories().then(setCategories);
      productApi.getSellers().then(setSellers);
    }
  }, [open]);

  useEffect(() => {
    if (form.category) {
      productApi.getSubcategories(form.category).then(setSubcategories);
    } else {
      setSubcategories([]);
    }
  }, [form.category]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") formData.append(key, value);
      });
      await productApi.createProduct(formData);
      setForm(initialForm);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit} className="product-add-form">
          <h2 style={{ fontSize: 18, marginBottom: 16, textAlign: 'left' }}>Thêm sản phẩm mới</h2>
          {error && <div className="error">{error}</div>}
          <div className="form-grid">
            <div>
              <label>Tên sản phẩm *</label>
              <input name="name" value={form.name} onChange={handleChange} required />

              <label>Mô tả</label>
              <textarea name="description" value={form.description} onChange={handleChange} />

              <label>Giá bán *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} required />

              <label>Đơn vị</label>
              <input name="unit" value={form.unit} onChange={handleChange} />

              <label>Số lượng tồn kho</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} />

              <label>Ảnh sản phẩm</label>
              <input name="image" type="file" accept="image/*" onChange={handleChange} />
            </div>
            <div>
              <label>Danh mục *</label>
              <select name="category" value={form.category} onChange={handleChange} required>
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <label>Nhóm hàng</label>
              <select name="subcategory" value={form.subcategory} onChange={handleChange}>
                <option value="">Chọn nhóm hàng</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>

              <label>Thương hiệu</label>
              <input name="brand" value={form.brand} onChange={handleChange} />

              <label>Vị trí</label>
              <input name="location" value={form.location} onChange={handleChange} />

              <label>Giảm giá (%)</label>
              <input name="discount" type="number" value={form.discount} onChange={handleChange} />

              <div className="checkbox-group">
                <label>
                  <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} />
                  Hàng mới
                </label>
                <label>
                  <input type="checkbox" name="is_organic" checked={form.is_organic} onChange={handleChange} />
                  Hữu cơ
                </label>
                <label>
                  <input type="checkbox" name="is_best_seller" checked={form.is_best_seller} onChange={handleChange} />
                  Bán chạy
                </label>
              </div>

              <label>Người bán</label>
              <select name="seller" value={form.seller} onChange={handleChange}>
                <option value="">Chọn người bán</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>Bỏ qua</button>
            <button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</button>
          </div>
        </form>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999;
        }
        .modal-content {
          background: #fff; border-radius: 8px; padding: 32px; min-width: 700px; max-width: 90vw;
        }
        .product-add-form {
          font-size: 14px;
        }
        .form-grid {
          display: flex;
          gap: 32px;
        }
        .form-grid > div {
          flex: 1;
        }
        .product-add-form label {
          display: block;
          margin-top: 10px;
          margin-bottom: 2px;
        }
        .product-add-form input,
        .product-add-form select,
        .product-add-form textarea {
          width: 100%;
          padding: 5px 8px;
          margin-top: 2px;
          border-radius: 4px;
          border: 1px solid #ccc;
          font-size: 14px;
        }
        .checkbox-group {
          display: flex;
          gap: 12px;
          margin: 8px 0 8px 0;
        }
        .checkbox-group label {
          margin-top: 0;
          margin-bottom: 0;
          font-weight: 400;
        }
        .modal-actions { margin-top: 20px; display: flex; gap: 12px; justify-content: flex-end; }
        .error { color: red; margin-bottom: 10px; }
      `}</style>
    </div>
  );
};

export default ProductAddModal;
