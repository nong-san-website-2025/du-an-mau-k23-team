// src/pages/NewProductsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Spin,
  Alert,
  Pagination,
  Typography,
} from "antd";
import { AppstoreOutlined } from "@ant-design/icons";

// Hooks & Services
import { useCart } from "../features/cart/services/CartContext";
import { productApi } from "../features/products/services/productApi";

// Components
import ProductCard from "../features/products/components/ProductCard"; // ⚠️ Hãy kiểm tra lại đường dẫn import này cho đúng với dự án của bạn

const { Text } = Typography;

const NewProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 18;

  const { addToCart, cartItems, updateQuantity } = useCart();

  // Lấy API URL từ env để xử lý ảnh khi add vào giỏ (nếu cần)
  const API_URL = process.env.REACT_APP_API_URL;
  const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:8000";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // 1. Lấy tất cả sản phẩm
        const data = await productApi.getAll();

        // 2. Lọc sản phẩm hiển thị được & Sắp xếp theo thời gian tạo mới nhất
        const sortedProducts = data
          .filter((p) => p.availability_status !== "hidden") // Tùy logic ẩn hiện của bạn
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setProducts(sortedProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Logic phân trang
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + productsPerPage);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async (e, product) => {
    // ProductCard đã xử lý e.stopPropagation(), nhưng giữ lại cho chắc chắn
    if (e && e.stopPropagation) e.stopPropagation();

    const getProductId = (item) => {
      return (
        item.product_data?.id ||
        (item.product?.id !== undefined ? item.product.id : item.product)
      );
    };

    const existingItem = cartItems.find(
      (item) => String(getProductId(item)) === String(product.id)
    );

    if (existingItem) {
      await updateQuantity(product.id, existingItem.quantity + 1);
      return;
    }

    // Xử lý logic lấy ảnh: Ưu tiên main_image (cấu trúc mới) -> image (cấu trúc cũ)
    let imageUrl = product.main_image?.image || product.image || "";
    
    // Nếu ảnh là đường dẫn tương đối, ghép thêm BASE_URL
    if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `${BASE_URL}${imageUrl}`;
    }

    await addToCart(product.id, 1, {
      id: product.id,
      name: product.name,
      price: product.discounted_price || product.price, // Ưu tiên lấy giá đã giảm
      image: imageUrl,
    });
  };

  if (error) {
    return (
      <div className="responsive-container">
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className="responsive-container">
      {/* Header Section */}
      <div
        style={{ marginBottom: "28px" }}
        className="responsive-header"
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 className="responsive-title">
            Sản phẩm mới
          </h2>
          <span
            style={{
              marginLeft: "12px",
              background: "#fffbeb",
              color: "#d97706",
              padding: "2px 10px",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: 600,
              border: "1px solid #fed7aa",
            }}
          >
            Vừa cập nhật
          </span>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 50 }}>
          <Spin size="large" />
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 50, color: "#888" }}>
          <AppstoreOutlined style={{ fontSize: 64 }} />
          <div style={{ marginTop: 10 }}>
            <Text>Không có sản phẩm nào</Text>
          </div>
        </div>
      ) : (
        <>
          <Row gutter={[16, 24]}>
            {currentProducts.map((product) => (
              <Col
                key={product.id}
                xs={12}      // Mobile: 2 cột (thường tốt hơn 1 cột cho ecommerce)
                sm={12}      // Tablet nhỏ: 2 cột
                md={8}       // Tablet: 3 cột
                lg={6}       // Desktop nhỏ: 4 cột
                xl={4}       // Desktop lớn: 6 cột
                xxl={4}
              >
                <ProductCard 
                    product={product} 
                    onAddToCart={handleAddToCart}
                    showAddToCart={true}
                />
              </Col>
            ))}
          </Row>

          {totalPages > 1 && (
            <div style={{display: "flex", marginTop: "32px", textAlign: "center", justifyContent: "center" }}>
              <Pagination
                current={currentPage}
                total={products.length}
                pageSize={productsPerPage}
                onChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll lên đầu khi chuyển trang
                }}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewProductsPage;