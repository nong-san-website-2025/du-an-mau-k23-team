import React from "react";
import { Link } from "react-router-dom";

export default function CategorySection({ categories = [] }) {
  return (
    <div className="mb-4">
      <h2 className="fs-5 fw-bold mb-3">Danh Mục Nổi Bật</h2>

      <div className="row g-3 text-center">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1 border"
          >
            <Link
              to={`/productuser?category=${cat.key || cat.name}`}
              className="text-decoration-none text-dark"
            >
              <div className="p-2">
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
                    style={{
                      maxWidth: "60%",
                      maxHeight: "60%",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <div
                  className="fw-medium text-center"
                  style={{
                    maxWidth: "90px",
                    margin: "0 auto",
                    fontSize: 12,
                    whiteSpace: "normal", // Cho phép xuống hàng
                    wordWrap: "break-word", // Tự động xuống hàng nếu từ quá dài
                    overflowWrap: "break-word", // Tương tự nhưng hỗ trợ chuẩn mới
                  }}
                >
                  {cat.name}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
