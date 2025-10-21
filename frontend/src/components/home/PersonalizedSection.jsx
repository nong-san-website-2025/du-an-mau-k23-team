import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { productApi } from "../../features/products/services/productApi.js";
import "../../styles/home/PersonalizedSections.css";
import { intcomma } from "../../utils/format.js";

const PersonalizedSection = ({ username }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // useInView hook
  const { ref, inView } = useInView({
    triggerOnce: true, // chỉ trigger 1 lần
    rootMargin: "0px 0px 200px 0px",
  });

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    if (inView && !hasLoaded) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const data = await productApi.getAllProducts();
          const shuffled = shuffleArray(data || []);
          setProducts(shuffled.slice(0, 18)); // chỉ lấy 18
          setHasLoaded(true);
        } catch (error) {

        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [inView, hasLoaded]);

  const displayedProducts = products.slice(0, 18);

  return (
    <div ref={ref} className="bg-white px-4 py-3 shadow-sm mt-1 w-100">
      <h2 className="fs-5 fw-bold mb-3">Gợi ý cho bạn</h2>

      <div className="row g-3">
        {loading
          ? Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="col-6 col-md-3 col-lg-2">
                <div className="placeholder-glow" style={{ height: "220px" }}>
                  <span className="placeholder w-100 h-100 rounded-3 d-block"></span>
                </div>
              </div>
            ))
          : displayedProducts.map((product) => (
              <div key={product.id} className="col-6 col-md-3 col-lg-2 ">
                <div
                  className="position-relative overflow-hidden shadow-sm product-card"
                  style={{
                    cursor: "pointer",
                    height: "240px",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={() => navigate(`/products/${product.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.1)";
                  }}
                >
                  <img
                    src={product.image || ""}
                    alt={product.name}
                    className="w-100 h-100 product-img"
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";

                      const parent = e.target.parentNode;
                      parent.style.position = "relative";

                      const noImageDiv = document.createElement("div");
                      noImageDiv.innerText = "No image";
                      noImageDiv.style.position = "absolute";
                      noImageDiv.style.top = "0";
                      noImageDiv.style.left = "0";
                      noImageDiv.style.width = "100%";
                      noImageDiv.style.height = "100%";
                      noImageDiv.style.display = "flex";
                      noImageDiv.style.alignItems = "center";
                      noImageDiv.style.justifyContent = "center";
                      noImageDiv.style.backgroundColor =
                        "linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)"; // xanh nhạt
                      noImageDiv.style.color = "#9d9d9dff"; // chữ xanh đậm nổi bật
                      noImageDiv.style.fontWeight = "bold";
                      noImageDiv.style.fontSize = "16px";
                      noImageDiv.style.borderRadius = "8px";

                      parent.appendChild(noImageDiv);
                    }}
                  />

                  {/* Tag giảm giá */}
                  {product.discount_percent > 0 && (
                    <div className="discount-tag">
                      -{product.discount_percent}%
                    </div>
                  )}

                  <div className="overlay">
                    <p className="product-name" title={product.name}>
                      {product.name}
                    </p>
                    <div className="overlay-bottom">
                      <span className="price">{intcomma(product.price)}đ</span>
                      <span className="sold">
                        {product.sold_count || 0} đã bán
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {!loading && products.length > 18 && (
        <div className="mt-3 text-center">
          <button
            className="btn btn-outline-secondary btn-sm px-4 py-2 fw-medium"
            onClick={() => navigate("/products")}
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
