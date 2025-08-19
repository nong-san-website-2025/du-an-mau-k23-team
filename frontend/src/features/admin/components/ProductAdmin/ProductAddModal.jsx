import React, { useState, useEffect } from "react";
import { productApi } from "../../../products/services/productApi";
import "../../styles/ProductAddModal.css";


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
      // Kiểm tra các trường bắt buộc
      if (!form.subcategory) {
        throw new Error("Vui lòng chọn nhóm hàng");
      }
      if (!form.seller) {
        throw new Error("Vui lòng chọn người bán");
      }

      const formData = new FormData();
      const fieldsToInclude = [
        "name",
        "description",
        "price",
        "unit",
        "stock",
        "image",
        "subcategory",
        "brand",
        "location",
        "discount",
        "is_new",
        "is_organic",
        "is_best_seller",
        "seller",
      ];
      fieldsToInclude.forEach((key) => {
        if (form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      // Log FormData để kiểm tra
      console.log("FormData:", [...formData]);

      const response = await productApi.createProduct(formData);
      console.log("Response:", response); // Log response để kiểm tra

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
    <div className="pam-modal-overlay">
      <div className="pam-modal-content wide p-3">
        <form onSubmit={handleSubmit} className="pam-form">
          <h6 className="pam-title fw-bold">Thêm sản phẩm mới</h6>
          {error && <div className="pam-error">{error}</div>}

          <div className="pam-form-grid">
            {/* Cột trái */}
            <div>
              <label className="pam-label">Tên sản phẩm * <span className="text-danger">(bắt buộc)</span></label>
              <input
                className="pam-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label className="pam-label">Mô tả</label>
              <textarea
                className="pam-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
              />

              <label className="pam-label">Giá bán *</label>
              <input
                className="pam-input"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
              />

              <label className="pam-label">Đơn vị</label>
              <input
                className="pam-input"
                name="unit"
                value={form.unit}
                onChange={handleChange}
              />

              <label className="pam-label">Số lượng tồn kho</label>
              <input
                className="pam-input"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
              />

              <label className="pam-label">Ảnh sản phẩm</label>
              <input
                className="pam-input"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            {/* Cột phải */}
            <div>
              <label className="pam-label">Danh mục * <span className="text-danger">(bắt buộc)</span></label>
              <select
                className="pam-select"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <label className="pam-label">Nhóm hàng * <span className="text-danger">(bắt buộc)</span></label>
              <select
                className="pam-select"
                name="subcategory"
                value={form.subcategory}
                onChange={handleChange}
              >
                <option value="">Chọn nhóm hàng</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <label className="pam-label">Thương hiệu</label>
              <input
                className="pam-input"
                name="brand"
                value={form.brand}
                onChange={handleChange}
              />

              <label className="pam-label">Vị trí</label>
              <input
                className="pam-input"
                name="location"
                value={form.location}
                onChange={handleChange}
              />

              <label className="pam-label">Giảm giá (%)</label>
              <input
                className="pam-input"
                name="discount"
                type="number"
                value={form.discount}
                onChange={handleChange}
              />

              <div className="pam-checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_new"
                    checked={form.is_new}
                    onChange={handleChange}
                  />{" "}
                  Hàng mới
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="is_organic"
                    checked={form.is_organic}
                    onChange={handleChange}
                  />{" "}
                  Hữu cơ
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="is_best_seller"
                    checked={form.is_best_seller}
                    onChange={handleChange}
                  />{" "}
                  Bán chạy
                </label>
              </div>
              <label className="pam-label">Người bán * <span className="text-danger">(bắt buộc)</span></label>
              <select
                className="pam-select"
                name="seller"
                value={form.seller}
                onChange={handleChange}
                required
              >
                <option value="">Chọn người bán</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.store_name}
                  </option>

                ))}
              </select>
            </div>
          </div>

          <div className="pam-actions">
            <button
              type="button"
              className="pam-btn pam-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Bỏ qua
            </button>
            <button
              type="submit"
              className="pam-btn pam-btn-primary"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductAddModal;
