// components/PersonalizedSection.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../features/products/services/productApi.js";
import "../../styles/home/PersonalizedSections.css";

const PersonalizedSection = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleViewAll = () => {
    navigate("/products");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAllProducts();
        setProducts(data || []);
      } catch (error) {
        console.error("❌ Lỗi tải sản phẩm gợi ý:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const displayedProducts = products.slice(0, 18);

  return (
    <div className="bg-white px-4 py-3 rounded-3 shadow-sm mt-1 w-100">
      <h2 className="fs-5 fw-bold mb-3">Gợi ý cho bạn</h2>

      <div className="row g-3">
        {loading
          ? Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="col-6 col-md-3 col-lg-2">
                <div
                  className="rounded-3 placeholder-glow"
                  style={{ height: "220px" }}
                >
                  <span className="placeholder w-100 h-100 rounded-3 d-block"></span>
                </div>
              </div>
            ))
          : displayedProducts.map((product) => (
              <div key={product.id} className="col-6 col-md-3 col-lg-2">
                <div
                  className="position-relative rounded-3 overflow-hidden shadow-sm"
                  style={{
                    height: "220px",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={() => navigate(`/products/${product.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  }}
                >
                  {/* Ảnh sản phẩm - full */}
                  <img
                    src={product.image || "https://via.placeholder.com/300x300?text=No+Image"}
                    alt={product.name}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />

                  {/* Overlay: Giá & Số đã bán */}
                  <div className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-between px-2 py-1">
                    {/* Giá - góc dưới trái */}
                    <div className="bg-white bg-opacity-90 rounded px-1">
                      <span className="text-danger fw-bold" style={{ fontSize: "0.85rem" }}>
                        {product.price?.toLocaleString()}đ
                      </span>
                    </div>

                    {/* Số đã bán - góc dưới phải */}
                    <div className="bg-black bg-opacity-50 text-white rounded px-1">
                      <span style={{ fontSize: "0.75rem" }}>
                        {product.sold_count || 0} đã bán
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tên sản phẩm - bên dưới card */}
                <div className="mt-2">
                  <p
                    className="text-truncate mb-0 fw-medium"
                    title={product.name}
                    style={{ fontSize: "0.9rem", lineHeight: 1.3 }}
                  >
                    {product.name}
                  </p>
                </div>
              </div>
            ))}
      </div>

      {!loading && products.length > 18 && (
        <div className="mt-3 text-center">
          <button
            className="btn btn-outline-secondary btn-sm px-4 py-2 fw-medium"
            onClick={handleViewAll}
            style={{ borderRadius: "8px" }}
          >
            Xem thêm
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalizedSection;