import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../features/products/services/productApi.js";
import "../../styles/home/PersonalizedSections.css";

const PersonalizedSection = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleViewAll = () => {
    navigate("/products"); // Điều hướng tới trang tất cả sản phẩm
  };

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAllProducts(); // hoặc getFeaturedProducts()
        setProducts(data || []);
      } catch (error) {
        console.error("❌ Lỗi tải sản phẩm gợi ý:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Chỉ lấy đúng 18 sản phẩm (3 hàng, mỗi hàng 6 sản phẩm)
  const displayedProducts = products.slice(0, 18);

  return (
    <div className="bg-white p-0 rounded-3 shadow-sm mt-1 w-100">
      <h2 className="fs-4 fw-bold mb-4">Gợi ý cho bạn</h2>

      <div className="row g-3">
        {loading
          ? Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="col-6 col-md-3 col-lg-2">
                <div
                  className="bg-light rounded-3 placeholder-glow"
                  style={{ height: "160px" }}
                >
                  <span className="placeholder w-100 h-100 rounded-3 d-block"></span>
                </div>
              </div>
            ))
          : displayedProducts.map((product, index) => (
              <div key={index} className="col-6 col-md-3 col-lg-2">
                <div
                  className="product-card d-flex flex-column align-items-center cursor-pointer p-2 h-100 border bg-white"
                  style={{ transition: "all 0.2s", cursor: "pointer" }}
                  onClick={() => navigate(`/products/${product.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0.5rem 1rem rgba(0,0,0,0.15)";
                    
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Ảnh sản phẩm */}
                  <div
                    className="w-100 bg-light rounded-3 overflow-hidden d-flex align-items-center justify-content-center"
                    style={{ height: "100px" }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="img-fluid h-100 w-100"
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  {/* Tên và giá */}
                  <div className="mt-2 text-center w-100">
                    <p
                      className="text-truncate fw-medium mb-1"
                      title={product.name}
                      style={{ fontSize: "0.9rem" }}
                    >
                      {product.name}
                    </p>
                    {product?.price !== undefined && (
                      <p
                        className="text-danger mb-0"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {product.price.toLocaleString()} đ
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Nút xem tất cả nằm riêng bên dưới */}
      {!loading && products.length > 18 && (
        <div className="mt-3">
          <div
            className="d-flex justify-content-center align-items-center border rounded-3 bg-light fw-bold"
            style={{
              height: "50px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: "grey",
            }}
            onClick={handleViewAll}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e9ecef";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
            }}
          >
            Xem thêm
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedSection;
