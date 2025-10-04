import React from "react";
import { Link } from "react-router-dom";
import "../../styles/home/CategorySections.css";

export default function CategorySection({ categories = [], loading = false }) {
  const fallbackImage = "/assets/logo/imagelogo.png";

  const placeholderCount = 12; // số lượng skeleton hiển thị khi load

  return (
    <div className="mb-4">
      <h2 className="fs-5 fw-bold mb-3">Danh Mục Nổi Bật</h2>

      <div className="row g-0 text-center">
        {loading
          ? Array.from({ length: placeholderCount }).map((_, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1">
                <div className="category-placeholder">
                  <div className="circle"></div>
                  <div className="text"></div>
                </div>
              </div>
            ))
          : categories.map((cat) => (
              <div
                key={cat.id}
                className="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1"
              >
                <Link
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="text-decoration-none text-dark"
                >
                  <div className="category-item p-2" style={{ height: "150px" }}>
                    <div
                      className="mx-auto mb-2"
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        backgroundColor: "#f5f5f5",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={cat.image || fallbackImage}
                        alt={cat.name}
                        className="img-fluid"
                        style={{
                          maxWidth: "80%",
                          maxHeight: "80%",
                          objectFit: "contain",
                        }}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackImage;
                        }}
                      />
                    </div>

                    <div
                      className="fw-medium text-center"
                      style={{
                        maxWidth: "66px",
                        margin: "0 auto",
                        fontSize: 12,
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
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
