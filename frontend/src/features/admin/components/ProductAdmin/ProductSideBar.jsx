import React, { useState } from "react";

export default function ProductSideBar({
  categories,
  selectedCategory,
  setSelectedCategory,
  onCategoryCreated,
}) {
  const [showModal, setShowModal] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [parentCat, setParentCat] = useState("");
  const [modalTimeout, setModalTimeout] = useState(null);

  const handleCreateClick = (e) => {
    e.preventDefault();
    // Trì hoãn 500ms (0.5 giây)
    setTimeout(() => {
      setShowModal(true);
    }, 500);
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

      console.log("Creating category:", categoryData);

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

      const result = await response.json();
      console.log("Category created successfully:", result);

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
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", background: "#0008" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form onSubmit={handleModalSubmit}>
                <div className="modal-header d-flex justify-content-between align-items-center p-0">
                  <h5 className="modal-title">Tạo loại hàng mới</h5>
                  <button
                    type="button"
                    className="btn-close bg-white"
                    style={{ width: "20px" }}
                    onClick={handleModalClose}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-0">
                    <label
                      className="form-label"
                      style={{ fontSize: "14px", paddingRight: "550px" }}
                    >
                      Tên loại hàng
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      required
                      style={{ height: "30px" }}
                    />
                  </div>
                  <div className="mb-2">
                    <label
                      className="form-label"
                      style={{ fontSize: "14px", paddingRight: "450px" }}
                    >
                      Chọn loại hàng cha (tùy chọn)
                    </label>
                    <select
                      className="form-select"
                      value={String(parentCat)}
                      onChange={(e) => setParentCat(String(e.target.value))}
                    >
                      <option value="">
                        -- Không có (tạo loại hàng gốc) --
                      </option>
                      {categories
                        .filter((cat) => cat.value !== "all") // Loại bỏ option "Tất cả loại hàng"
                        .map((cat) => (
                          <option key={cat.value} value={String(cat.value)}>
                            {cat.label}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
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
        </div>
      )}
      {/* Có thể thêm filter nâng cao ở đây */}
    </div>
  );
}
