// src/components/home/PersonalizedSection.jsx
import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { productApi } from "../../features/products/services/productApi.js";
import ProductCard from "../../features/products/components/ProductCard.jsx";
import "../../styles/home/PersonalizedSections.css";
import { useCart } from "../../features/cart/services/CartContext";

const PersonalizedSection = ({ username, onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { addToCart } = useCart();

  const { ref, inView } = useInView({
    triggerOnce: true,
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
          setProducts(shuffled.slice(0, 18));
          setHasLoaded(true);
        } catch (error) {
          console.error("Lỗi khi tải sản phẩm:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [inView, hasLoaded]);

  // src/components/home/PersonalizedSection.jsx
  return (
    <div ref={ref} className="mb-4">
      <h2 className="fs-5 fw-normal mb-3">GỢI Ý CHO BẠN</h2>

      <div className="row g-3">
        {loading
          ? Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="col-6 col-md-3 col-lg-2">
                <div className="placeholder-glow" style={{ height: "220px" }}>
                  <span className="placeholder w-100 h-100 rounded-3 d-block"></span>
                </div>
              </div>
            ))
          : products.map((product) => (
              <div key={product.id} className="col-6 col-md-3 col-lg-2">
                <ProductCard
                  product={product}
                  onAddToCart={(e, product) => {
                    e.stopPropagation();
                    addToCart(product.id, 1, product);
                  }}
                />
              </div>
            ))}
      </div>

      {!loading && products.length > 18 && (
        <div className="mt-3 text-center">
          <button
            className="btn btn-outline-secondary btn-sm px-4 py-2 fw-medium"
            onClick={() => (window.location.href = "/products")}
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
