import React from "react";
import { Link } from "react-router-dom";
import "../../styles/home/CategorySections.css";

export default function CategorySection({ categories = [], loading = false }) {
  const fallbackImage = "/assets/logo/imagelogo.png";
  const placeholderCount = 12;

  return (
    <div className="mb-4">
      <h2 className="fs-5 fw-bold mb-3">Danh Mục Nổi Bật</h2>

      <div className="category-scroll-container ">
        {loading
          ? Array.from({ length: placeholderCount }).map((_, idx) => (
              <div key={idx} className="category-placeholder">
                <div className="circle"></div>
                <div className="text"></div>
              </div>
            ))
          : categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="category-item text-decoration-none text-dark pt-3"
              >
                <div
                  className="category-inner"
                  style={{
                    width: "120px",
                    height: "140px",
                  }}
                >
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
                      fontSize: 12,
                      maxWidth: "80px",
                      margin: "0 auto",
                      wordWrap: "break-word",
                    }}
                  >
                    {cat.name}
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
