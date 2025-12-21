// src/pages/NewProductsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Alert,
  Button,
  Pagination,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useCart } from "../features/cart/services/CartContext";
import { productApi } from "../features/products/services/productApi";
import { ShoppingCartOutlined, AppstoreOutlined } from "@ant-design/icons";
import "../features/products/styles/UserProductPage.css";
import NoImage from "../components/shared/NoImage"; // ✅ Import NoImage

const { Title, Text } = Typography;

// Hàm kiểm tra URL ảnh hợp lệ
const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("http") || url.startsWith("/");
};

const NewProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 18;

  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity } = useCart();

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;
  // Tạo Base URL (bỏ /api) để dùng cho hình ảnh
  const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:8000";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAll();
        const available = data
          .filter((p) => p.availability_status === "available")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setProducts(available);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + productsPerPage);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
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

    await addToCart(product.id, 1, {
      id: product.id,
      name: product.name,
      price: product.price,
      // SỬ DỤNG BASE_URL Ở ĐÂY
      image: product.image?.startsWith("/")
        ? `${BASE_URL}${product.image}`
        : product.image?.startsWith("http")
          ? product.image
          : "",
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
      <div
        style={{
          marginBottom: "28px",
        }}
        className="responsive-header"
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 className="responsive-title">
            Sản phẩm mới
            <span />
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

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 50 }}>
          <Spin size="large" />
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 50, color: "#888" }}>
          <AppstoreOutlined style={{ fontSize: 64 }} />
          <Text>Không có sản phẩm mới nào</Text>
        </div>
      ) : (
        <>
          <Row gutter={[16, 24]}>
            {currentProducts.map((product) => (
              <Col
                key={product.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                xl={4}
                xxl={4}
              >
                <Card
                  hoverable
                  cover={
                    isValidImageUrl(product.image) ? (
                      <img
                        alt={product.name}
                        // SỬ DỤNG BASE_URL Ở ĐÂY
                        src={
                          product.image.startsWith("/")
                            ? `${BASE_URL}${product.image}`
                            : product.image
                        }
                        style={{ height: 160, objectFit: "cover", width: "100%" }}
                      />
                    ) : (
                      <NoImage height={160} text="No image" />
                    )
                  }
                  onClick={() => navigate(`/products/${product.id}`)}
                  style={{ borderRadius: 8 }}
                >
                  <Card.Meta
                    title={
                      <Text strong ellipsis={{ tooltip: product.name }}>
                        {product.name}
                      </Text>
                    }
                    description={
                      <>
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text type="danger" strong>
                            {Math.round(product.price)?.toLocaleString("vi-VN")}{" "}
                            VNĐ
                          </Text>
                          <Button
                            type="primary"
                            className="custom-btn"
                            shape="default"
                            icon={<ShoppingCartOutlined />}
                            size="small"
                            onClick={(e) => handleAddToCart(e, product)}
                          />
                        </div>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {totalPages > 1 && (
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Pagination
                current={currentPage}
                total={products.length}
                pageSize={productsPerPage}
                onChange={(page) => setCurrentPage(page)}
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