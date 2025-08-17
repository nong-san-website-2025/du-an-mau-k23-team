import React, { useState, useEffect } from "react";
import { productApi } from "../../../products/services/productApi";
import "../../styles/ProductEditModal.css";

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

const ProductEditModal = ({ open, onClose, product, onSuccess }) => {
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

  useEffect(() => {
    if (product) {
      setForm({
        ...initialForm,
        ...product,
        category: product.category?.id || product.category || "",
        subcategory: product.subcategory?.id || product.subcategory || "",
        seller: product.seller?.id || product.seller || "",
      });
    }
  }, [product]);

  if (!open || !product) return null;

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
      await productApi.updateProduct(product.id, formData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Có lỗi khi cập nhật sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pem-modal-overlay" >
      <div className="pem-modal-content wide p-3">
        <form onSubmit={handleSubmit} className="pem-form">
          <h6 className="pem-title fw-bold">Sửa hàng hoá</h6>
          {error && <div className="pem-error">{error}</div>}

          <div className="pem-form-grid">
            {/* Cột trái */}
            <div>
              <label className="pem-label">Tên sản phẩm *</label>
              <input className="pem-input" name="name" value={form.name} onChange={handleChange} required />

              <label className="pem-label">Mô tả</label>
              <textarea className="pem-textarea" name="description" value={form.description} onChange={handleChange} />

              <label className="pem-label">Giá bán *</label>
              <input className="pem-input" name="price" type="number" value={form.price} onChange={handleChange} required />

              <label className="pem-label">Đơn vị</label>
              <input className="pem-input" name="unit" value={form.unit} onChange={handleChange} />

              <label className="pem-label">Số lượng tồn kho</label>
              <input className="pem-input" name="stock" type="number" value={form.stock} onChange={handleChange} />

              <label className="pem-label">Ảnh sản phẩm</label>
              <input className="pem-input" name="image" type="file" accept="image/*" onChange={handleChange} />
            </div>

            {/* Cột phải */}
            <div>
              <label className="pem-label">Danh mục *</label>
              <select className="pem-select" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <label className="pem-label">Nhóm hàng</label>
              <select className="pem-select" name="subcategory" value={form.subcategory} onChange={handleChange}>
                <option value="">Chọn nhóm hàng</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>

              <label className="pem-label">Thương hiệu</label>
              <input className="pem-input" name="brand" value={form.brand} onChange={handleChange} />

              <label className="pem-label">Vị trí</label>
              <input className="pem-input" name="location" value={form.location} onChange={handleChange} />

              <label className="pem-label">Giảm giá (%)</label>
              <input className="pem-input" name="discount" type="number" value={form.discount} onChange={handleChange} />

              <div className="pem-checkbox-group">
                <label>
                  <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} /> Hàng mới
                </label>
                <label>
                  <input type="checkbox" name="is_organic" checked={form.is_organic} onChange={handleChange} /> Hữu cơ
                </label>
                <label>
                  <input type="checkbox" name="is_best_seller" checked={form.is_best_seller} onChange={handleChange} /> Bán chạy
                </label>
              </div>

              <label className="pem-label">Người bán</label>
              <select className="pem-select" name="seller" value={form.seller} onChange={handleChange}>
                <option value="">Chọn người bán</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pem-actions">
            <button type="button" className="pem-btn pem-btn-secondary" onClick={onClose} disabled={loading}>Bỏ qua</button>
            <button type="submit" className="pem-btn pem-btn-primary" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditModal;
