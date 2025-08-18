import React, { useState, useEffect } from "react";

export default function ProductAddEditModal({ show, onClose, onSave, editing }) {
  const [form, setForm] = useState({
    id: undefined,
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    brand: "",
    location: "",
    unit: "",
    image: "",
  });

  useEffect(() => {
    if (editing) setForm(editing);
  }, [editing]);

  if (!show) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{
        background: "#0005",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content border-0 shadow rounded-3" style={{ minWidth: "700px" }}>
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {editing ? "✏️ Chỉnh sửa sản phẩm" : "➕ Thêm sản phẩm"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} style={{ fontSize: "0.8rem", width: "24px", height: "24px", marginLeft: "auto" }}></button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Tên sản phẩm</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Giá (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Tồn kho</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Danh mục</label>
                  <input
                    className="form-control"
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Đơn vị</label>
                  <input
                    className="form-control"
                    value={form.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                {/* <div className="col-md-6 mb-3">
                  <label className="form-label">Thương hiệu</label>
                  <input
                    className="form-control"
                    value={form.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                  />
                </div> */}

                <div className="col-md-6 mb-3">
                  <label className="form-label">Xuất xứ</label>
                  <input
                    className="form-control"
                    value={form.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Ảnh (URL)</label>
                <input
                  className="form-control mb-2"
                  value={form.image}
                  onChange={(e) => handleChange("image", e.target.value)}
                />
                {form.image && (
                  <div className="text-center">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="rounded border"    
                      style={{ maxHeight: 120 }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                {editing ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
