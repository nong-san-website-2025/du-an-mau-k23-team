import React, { useState } from "react";

export default function ProductSideBar({
  categories,
  selectedCategory,
  setSelectedCategory,
  onCategoryCreated,
  variant = "vertical", // "vertical" | "top"
}) {
  const [showModal, setShowModal] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [parentCat, setParentCat] = useState("");
  const [modalTimeout, setModalTimeout] = useState(null);

  const handleCreateClick = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setNewSubName("");
    setParentCat("");
    if (modalTimeout) clearTimeout(modalTimeout);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!newSubName.trim()) {
      alert("Vui lòng nhập tên loại hàng");
      return;
    }

    try {
      const categoryData = {
        name: newSubName.trim(),
        parent_id: parentCat === "" ? null : Number(parentCat), // null nếu là category gốc
      };

      const response = await fetch(
        "http://localhost:8000/api/products/categories/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // eslint-disable-next-line no-unused-vars
      const result = await response.json();

      // Đóng modal và reset form
      setShowModal(false);
      setNewSubName("");
      setParentCat("");

      // Refresh danh sách categories
      if (onCategoryCreated) {
        onCategoryCreated();
      }

      alert("Tạo loại hàng mới thành công!");
    } catch (error) {
      console.error("Error creating category:", error);
      alert(`Có lỗi xảy ra khi tạo loại hàng mới: ${error.message}`);
    }
  };

  // Top (horizontal) variant for placing above content
  if (variant === "top") {
    return (
      <div className="bg-white border-bottom p-2">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold" style={{ fontSize: 14 }}>Loại hàng</span>
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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[600px] shadow-lg">
              <form onSubmit={handleModalSubmit}>
                <div className="flex justify-between items-center border-b p-3">
                  <h5 className="font-bold">Tạo loại hàng mới</h5>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-black"
                    onClick={handleModalClose}
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <label className="block text-sm font-medium mb-1">Tên loại hàng</label>
                  <input
                    type="text"
                    className="form-control mb-3"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    required
                  />

                  <label className="block text-sm font-medium mb-1">Loại hàng cha (tuỳ chọn)</label>
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
                <div className="flex justify-end gap-2 border-t p-3">
                  <button type="button" className="btn btn-secondary" onClick={handleModalClose}>
                    Huỷ
                  </button>
                  <button type="submit" className="btn btn-success">
                    Tạo mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default vertical (sidebar) variant
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

      {/* Modal tạo mới subcategory */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] shadow-lg">
            <form onSubmit={handleModalSubmit}>
              <div className="flex justify-between items-center border-b p-3">
                <h5 className="font-bold">Tạo loại hàng mới</h5>
                <button
                  type="button"
                  className="text-gray-500 hover:text-black"
                  onClick={handleModalClose}
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <label className="block text-sm font-medium mb-1">
                  Tên loại hàng
                </label>
                <input
                  type="text"
                  className="form-control mb-3"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  required
                />

                <label className="block text-sm font-medium mb-1">
                  Loại hàng cha (tuỳ chọn)
                </label>
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
              <div className="flex justify-end gap-2 border-t p-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalClose}
                >
                  Huỷ
                </button>
                <button type="submit" className="btn btn-success">
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Có thể thêm filter nâng cao ở đây */}
    </div>
  );
}