import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 22 } },
  exit: { opacity: 0, y: 24, scale: 0.98 },
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
        description,
      });

      if (categoryId) {
        productApi.getSubcategories(categoryId).then((subs) => {
          setSubcategories(subs);
          if (
            subcategoryId &&
            subs.some((sub) => String(sub.id) === String(subcategoryId))
          ) {
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

      const response = await productApi.updateProduct(product.id, formData);
      console.log("Update product response:", response);

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      setError(err.message || "Có lỗi khi cập nhật sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          className="pem-modal-overlay d-flex align-items-center justify-content-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          style={{ backdropFilter: "blur(2px)", background: "rgba(0,0,0,0.35)" }}
        >
          <motion.div
            className="pem-modal-content p-0 border-0 shadow-lg"
            variants={modalVariants}
            style={{ maxWidth: 900, width: "96%", borderRadius: 16, overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="pem-form bg-white">
              <div className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ background: "#f8fafc" }}>
                <h5 className="m-0 fw-bold">Sửa hàng hoá</h5>
                <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
                  ✕
                </button>
              </div>

              {error && <div className="alert alert-danger m-3">{error}</div>}

              <div className="row g-3 p-3">
                {/* Left column */}
                <div className="col-12 col-lg-6">
                  <div className="mb-2">
                    <label className="form-label">Tên sản phẩm <span className="text-danger">*</span></label>
                    <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-control" rows={5} name="description" value={form.description ?? ""} onChange={handleChange} />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Giá bán <span className="text-danger">*</span></label>
                    <input className="form-control" name="price" type="number" value={form.price} onChange={handleChange} required />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label">Đơn vị</label>
                      <input className="form-control" name="unit" value={form.unit} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Tồn kho</label>
                      <input className="form-control" name="stock" type="number" value={form.stock} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="form-label">Ảnh sản phẩm</label>
                    <input className="form-control" name="image" type="file" accept="image/*" onChange={handleChange} />
                  </div>
                </div>

                {/* Right column */}
                <div className="col-12 col-lg-6">
                  <div className="mb-2">
                    <label className="form-label">Danh mục <span className="text-danger">*</span></label>
                    <select className="form-select" name="category" value={form.category} onChange={handleChange} required>
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Nhóm hàng <span className="text-danger">*</span></label>
                    <select className="form-select" name="subcategory" value={form.subcategory} onChange={handleChange} required>
                      <option value="">Chọn nhóm hàng</option>
                      {subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Thương hiệu</label>
                    <input className="form-control" name="brand" value={form.brand} onChange={handleChange} />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Vị trí</label>
                    <input className="form-control" name="location" value={form.location} onChange={handleChange} />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label">Giảm giá (%)</label>
                      <input className="form-control" name="discount" type="number" value={form.discount} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Người bán <span className="text-danger">*</span></label>
                      <select className="form-select" name="seller" value={form.seller} onChange={handleChange} required>
                        <option value="">Chọn người bán</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>{s.store_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="d-flex gap-3 mt-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="e_is_new" name="is_new" checked={form.is_new} onChange={handleChange} />
                      <label htmlFor="e_is_new" className="form-check-label">Hàng mới</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="e_is_organic" name="is_organic" checked={form.is_organic} onChange={handleChange} />
                      <label htmlFor="e_is_organic" className="form-check-label">Hữu cơ</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="e_is_best_seller" name="is_best_seller" checked={form.is_best_seller} onChange={handleChange} />
                      <label htmlFor="e_is_best_seller" className="form-check-label">Bán chạy</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 p-3 border-top bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Bỏ qua</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductEditModal;