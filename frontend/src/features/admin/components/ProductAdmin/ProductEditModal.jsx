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
    if (open && product) {
      productApi.getCategories().then(setCategories);
      productApi.getSellers().then(setSellers);

      // Điền dữ liệu sản phẩm
      const categoryId = product.category_id || (product.category?.id ?? product.category) || "";
      const subcategoryId = product.subcategory_id || (product.subcategory?.id ?? product.subcategory) || "";
      const sellerId = (product.seller?.id ?? product.seller) || "";
      const description = product.description ?? "";

      setForm({
        ...initialForm,
        ...product,
        category: categoryId,
        subcategory: subcategoryId,
        seller: sellerId,
        description: description,
      });

      console.log('Product data:', product);
      console.log('Form after set:', { 
        category: categoryId, 
        subcategory: subcategoryId, 
        seller: sellerId, 
        description: description 
      });

      // Tải subcategories dựa trên category
      if (categoryId) {
        productApi.getSubcategories(categoryId).then((subs) => {
          setSubcategories(subs);
          if (subcategoryId && subs.some(sub => sub.id === parseInt(subcategoryId))) {
            setForm((prev) => ({ ...prev, subcategory: subcategoryId }));
          }
        });
      } else {
        setSubcategories([]);
      }
    }
  }, [open, product]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
      if (name === "category") {
        if (value) {
          productApi.getSubcategories(value).then(setSubcategories);
        } else {
          setSubcategories([]);
          setForm((prev) => ({ ...prev, subcategory: "" }));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!form.name) throw new Error("Vui lòng nhập tên sản phẩm");
      if (!form.price) throw new Error("Vui lòng nhập giá bán");
      if (!form.category) throw new Error("Vui lòng chọn danh mục");
      if (!form.subcategory) throw new Error("Vui lòng chọn nhóm hàng");
      if (!form.seller) throw new Error("Vui lòng chọn người bán");

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

      console.log("FormData:", [...formData]);

      const response = await productApi.updateProduct(product.id, formData);
      console.log("Update response:", response);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Có lỗi khi cập nhật sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !product) return null;

  return (
    <div className="pem-modal-overlay">
      <div className="pem-modal-content wide p-3">
        <form onSubmit={handleSubmit} className="pem-form">
          <h5 className="pem-title fw-bold">Sửa hàng hoá</h5>
          {error && <div className="pem-error">{error}</div>}

          <div className="pem-form-grid">
            {/* Cột trái */}
            <div>
              <label className="pem-label">Tên sản phẩm * <span className="text-danger">(bắt buộc)</span></label>
              <input className="pem-input" name="name" value={form.name} onChange={handleChange} required />

              <label className="pem-label">Mô tả</label>
              <textarea 
                className="pem-textarea" 
                name="description" 
                value={form.description ?? ""} 
                onChange={handleChange} 
              />

               <label className="pem-label">Giá mua * <span className="text-danger">(bắt buộc)</span></label>
              <input className="pem-input" name="price" type="number" value="0"  />  

              <label className="pem-label">Giá bán * <span className="text-danger">(bắt buộc)</span></label>
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
              <label className="pem-label">Danh mục * <span className="text-danger">(bắt buộc)</span></label>
              <select className="pem-select" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <label className="pem-label">Nhóm hàng * <span className="text-danger">(bắt buộc)</span></label>
              <select className="pem-select" name="subcategory" value={form.subcategory} onChange={handleChange} required>
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

              <label className="pem-label">Người bán * <span className="text-danger">(bắt buộc)</span></label>
              <select className="pem-select" name="seller" value={form.seller} onChange={handleChange} required>
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