import React from "react";

export default function CategorySection({ categories = [] }) {
  return (
    <div className="mb-4">
      <h2 className="fs-5 fw-bold mb-3">Danh Mục Nổi Bật</h2>

      <div className="row g-3 text-center">
        {categories.map((cat) => (
          <div key={cat.id} className="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1">
            <div className="p-2">
              {/* Ảnh danh mục */}
              <div
                className="mx-auto mb-2"
                style={{
                  width: "80px",
                  height: "80px",
                  overflow: "hidden",
                  borderRadius: "8px",
                  background: "#f8f9fa",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="img-fluid"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>

              {/* Tên danh mục */}
              <div className="fw-medium text-truncate" style={{ maxWidth: "90px", margin: "0 auto" }}>
                {cat.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
