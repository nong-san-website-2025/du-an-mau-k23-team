import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { addCategory } from "../../services/products"; 

const API_URL = process.env.REACT_APP_API_URL;
export default function ProductSideBar({
  categories,
  selectedCategory,
  setSelectedCategory,
  onCategoryCreated,
  variant = "vertical", // "vertical" | "top"
}) {
  const [showModal, setShowModal] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [parentCat, setParentCat] = useState("");

  const handleCreateClick = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setNewSubName("");
    setParentCat("");
    setNewKey(""); 
  };

const handleModalSubmit = async (e) => {
  e.preventDefault();

  if (!newSubName.trim()) {
    alert("Vui lòng nhập tên loại hàng");
    return;
  }

  try {
    const categoryData = {
      key: newKey.trim(),
      name: newSubName.trim(),
      parent_id: parentCat === "" ? null : Number(parentCat),
    };

    await addCategory(categoryData);  // chỉ cần gọi hàm này

    setShowModal(false);
    setNewSubName("");
    setParentCat("");

    onCategoryCreated && onCategoryCreated();
    alert("Tạo loại hàng mới thành công!");
  } catch (error) {
    console.error("Error creating category:", error);
    alert(`Có lỗi xảy ra khi tạo loại hàng mới: ${error.message}`);
  }
};

  const modal = (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 1055,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3 shadow-lg"
            style={{ width: 600, maxWidth: "92%" }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleModalSubmit}>
              <div className="d-flex justify-content-between align-items-center border-bottom p-3">
                <h5 className="m-0">Tạo loại hàng mới</h5>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleModalClose}
                >
                  ✕
                </button>
              </div>
              <div className="p-3">

                 <label className="form-label">Mã loại hàng (Key)</label>
                <input
                  type="text"
                  className="form-control mb-3"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                />

                <label className="form-label">Tên loại hàng</label>
                <input
                  type="text"
                  className="form-control mb-3"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  required
                />

                <label className="form-label">Loại hàng cha (tuỳ chọn)</label>
                <select
                  className="form-select"
                  value={String(parentCat)}
                  onChange={(e) => setParentCat(e.target.value)}
                >
                  <option value="">-- Không có (gốc) --</option>
                  {categories
                    .filter((cat) => cat.value !== "all")
                    .map((cat) => (
                      <option key={cat.value} value={String(cat.value)}>
                        {cat.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="d-flex justify-content-end gap-2 border-top p-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleModalClose}
                >
                  Huỷ
                </button>
                <button type="submit" className="btn btn-success">
                  Tạo mới
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (variant === "top") {
    return (
      <div className="bg-white border-bottom p-2">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold" style={{ fontSize: 14 }}>
              Loại hàng
            </span>
            <select
              className="form-select"
              style={{ width: 280 }}
              value={String(selectedCategory)}
              onChange={(e) => setSelectedCategory(String(e.target.value))}
            >
              <option value="all">Tất cả loại hàng</option>
              {categories.map((cat) => (
                <option key={cat.value} value={String(cat.value)}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn"
            style={{
              backgroundColor: "#22C55E",
              color: "#fff",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: 8,
              border: "none",
            }}
            onClick={handleCreateClick}
          >
            Tạo mới loại hàng
          </button>
        </div>
        {modal}
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded shadow-sm border mb-3">
      <h5 className="fw-bold mb-4">Hàng hoá</h5>
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between ">
          <label className="form-label fw-bold" style={{ fontSize: "14px" }}>
            Loại hàng
          </label>
          <a
            href="#"
            onClick={handleCreateClick}
            style={{
              textDecoration: "none",
              color: "#22C55E",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Tạo mới
          </a>
        </div>
        <select
          className="form-select"
          value={String(selectedCategory)}
          onChange={(e) => setSelectedCategory(String(e.target.value))}
        >
          <option value="all">Tất cả loại hàng</option>
          {categories.map((cat) => (
            <option key={cat.value} value={String(cat.value)}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      {modal}
    </div>
  );
}
