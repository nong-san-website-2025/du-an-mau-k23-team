
import React, { useState, useEffect } from "react";
import choiceApi from "../../services/choiceApi";
import "./styles/ProductAddModal.css";

export default function ProductAddModal({ show, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    unit: "kg",
    stock: "",
    image: null,
    rating: "0",
    review_count: "0",
    is_new: false,
    is_organic: false,
    is_best_seller: false,
    discount: "0",
    location: "",
    brand: "",
    category_id: "",
    subcategory_id: "",
    seller: "",
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    if (show) {
      choiceApi
        .getCategories()
        .then(setCategories)
        .catch(() => setCategories([]));
      choiceApi
        .getSellers()
        .then(setSellers)
        .catch(() => setSellers([]));
    }
  }, [show]);

  useEffect(() => {
    if (form.category_id) {
      choiceApi
        .getSubcategories(form.category_id)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [form.category_id]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      console.log("=== FILE INPUT DEBUG ===");
      console.log("Files:", files);
      console.log("Files length:", files?.length);
      if (files && files[0]) {
        console.log("Selected file:", files[0]);
        console.log("File name:", files[0].name);
        console.log("File size:", files[0].size);
        console.log("File type:", files[0].type);
        setForm((prev) => ({ ...prev, [name]: files[0] }));
      } else {
        console.log("No valid file selected");
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let submitData;
      
      // Luôn sử dụng FormData để xử lý file và dữ liệu đúng cách
      const fd = new FormData();
      
      // Thêm tất cả các field vào FormData
      Object.entries(form).forEach(([key, value]) => {
        console.log(`Processing field: ${key} =`, value);
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'image' && value instanceof File) {
            console.log("Adding image file:", value.name, value.size);
            fd.append(key, value);
          } else if (key === 'image' && !(value instanceof File)) {
            // Bỏ qua nếu không phải file thực sự
            console.log("Skipping invalid image:", value);
            return;
          } else {
            fd.append(key, value.toString());
          }
        } else {
          console.log(`Skipping empty field: ${key}`);
        }
      });

      // Đảm bảo các field quan trọng được gửi
      if (form.category_id) {
        fd.set('category_id', form.category_id.toString());
        console.log("Set category_id:", form.category_id);
      }
      
      if (form.subcategory_id) {
        fd.set('subcategory_id', form.subcategory_id.toString());
        console.log("Set subcategory_id:", form.subcategory_id);
      }

      if (form.seller) {
        fd.set('seller', form.seller.toString());
        console.log("Set seller:", form.seller);
      }

      // Đảm bảo các field bắt buộc được gửi
      if (form.name) {
        fd.set('name', form.name);
        console.log("Set name:", form.name);
      }
      
      if (form.price) {
        fd.set('price', form.price.toString());
        console.log("Set price:", form.price);
      }
      
      if (form.stock) {
        fd.set('stock', form.stock.toString());
        console.log("Set stock:", form.stock);
      }

      console.log("=== FORMDATA DEBUG ===");
      console.log("FormData content:");
      for (let [key, value] of fd.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      console.log("FormData has image:", fd.has('image'));
      if (fd.has('image')) {
        const imageFile = fd.get('image');
        console.log("Image in FormData:", imageFile);
        if (imageFile instanceof File) {
          console.log("Image file details:", {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type
          });
        }
      }
      
      submitData = fd;
      console.log("Submitting data:", submitData);
      
      await choiceApi.createProduct(submitData);
      setForm({
        name: "",
        description: "",
        price: "",
        unit: "kg",
        stock: "",
        image: null,
        rating: "0",
        review_count: "0",
        is_new: false,
        is_organic: false,
        is_best_seller: false,
        discount: "0",
        location: "",
        brand: "",
        category_id: "",
        subcategory_id: "",
        seller: "",
      });
      onClose();
      onAdd(); // Gọi callback để refresh danh sách sản phẩm
    } catch (err) {
      console.error("Error creating product:", err);
      alert("Thêm sản phẩm thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="product-add-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.25)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          minWidth: 600,
          maxWidth: 900,
          padding: 18,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          animation: "fadeInModal 0.3s",
        }}
      >
        <h4 className="mb-3" style={{ fontSize: "1.1rem" }}>
          Tạo sản phẩm
        </h4>
        <hr />
        <form onSubmit={handleSubmit}>
          <div className="row g-3" style={{ fontSize: "0.85rem" }}>
            <div className="col-md-6">
              <label className="form-label" style={{ padding: "0px" }}>
                Tên sản phẩm
              </label>
              <input
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                required
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mô tả</label>
              <input
                name="description"
                className="form-control"
                value={form.description}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Giá</label>
              <input
                name="price"
                className="form-control"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Tồn kho</label>
              <input
                name="stock"
                className="form-control"
                type="number"
                value={form.stock}
                onChange={handleChange}
                required
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Đơn vị</label>
              <input
                name="unit"
                className="form-control"
                value={form.unit}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Ảnh (file)</label>
              <input
                name="image"
                className="form-control"
                type="file"
                accept="image/*"
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Thương hiệu</label>
              <input
                name="brand"
                className="form-control"
                value={form.brand}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Vị trí</label>
              <input
                name="location"
                className="form-control"
                value={form.location}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Giảm giá (%)</label>
              <input
                name="discount"
                className="form-control"
                type="number"
                value={form.discount}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Điểm đánh giá</label>
              <input
                name="rating"
                className="form-control"
                type="number"
                step="0.1"
                value={form.rating}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Số lượt đánh giá</label>
              <input
                name="review_count"
                className="form-control"
                type="number"
                value={form.review_count}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Loại hàng</label>
              <select
                name="category_id"
                className="form-select"
                value={form.category_id}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              >
                <option value="">Chọn loại hàng</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Phân loại</label>
              <select
                name="subcategory_id"
                className="form-select"
                value={form.subcategory_id}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              >
                <option value="">Chọn phân loại</option>
                {subcategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Người bán</label>
              <select
                name="seller"
                className="form-select"
                value={form.seller}
                onChange={handleChange}
                style={{ fontSize: "0.85rem" }}
              >
                <option value="">Chọn người bán</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.store_name || s.user?.full_name || s.user?.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? "Đang thêm..." : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
