// src/pages/ComingSoonProductsPage.jsx
import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Spin, Alert, Button, Pagination } from "antd";
import { useNavigate } from "react-router-dom";
import { productApi } from "../features/products/services/productApi";
import { AppstoreOutlined, ClockCircleOutlined } from "@ant-design/icons";
import "../features/products/styles/UserProductPage.css";
import NoImage from "../components/shared/NoImage"; // ✅ Import NoImage

const { Text } = Typography;

// Hàm kiểm tra ảnh hợp lệ
const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("http") || url.startsWith("/");
};

const ComingSoonProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 18;

  const navigate = useNavigate();

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;
  // Tạo Base URL (bỏ /api) để dùng cho hình ảnh
  // Ví dụ: http://localhost:8000/api -> http://localhost:8000
  const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:8000";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productApi.getAll();
        const coming = data
          .filter((p) => p.availability_status === "coming_soon")
          .sort(
            (a, b) =>
              new Date(a.season_start || "2100-01-01") -
              new Date(b.season_start || "2100-01-01")
          );
        setProducts(coming);
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

  if (error) {
    return (
      <div style={{ padding: "12px 190px" }}>
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 190px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              position: "relative",
              paddingBottom: "6px",
            }}
          >
            Sắp ra mắt
            <span
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "72px",
                height: "3px",
                backgroundColor: "#3b82f6",
                borderRadius: "2px",
              }}
            />
          </h2>
          <span
            style={{
              marginLeft: "12px",
              background: "#dbeafe",
              color: "#1d4ed8",
              padding: "2px 10px",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: 600,
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ClockCircleOutlined style={{ marginRight: "4px", fontSize: "12px" }} />
            Sắp có
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
          <Text>Không có sản phẩm sắp ra mắt</Text>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {currentProducts.map((product) => (
              <Col key={product.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={4}>
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
                >
                  <Card.Meta
                    title={
                      <Text strong ellipsis={{ tooltip: product.name }}>
                        {product.name}
                      </Text>
                    }
                    description={
                      <>
                        <Text type="secondary">
                          Sắp có:{" "}
                          {product.season_start
                            ? new Date(product.season_start).toLocaleDateString("vi-VN")
                            : "?"}{" "}
                          →{" "}
                          {product.season_end
                            ? new Date(product.season_end).toLocaleDateString("vi-VN")
                            : "?"}
                        </Text>
                        <br />
                        <Text type="warning">
                          Ước lượng: {product.estimated_quantity || 0} sản phẩm
                        </Text>
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            type="default"
                            size="small"
                            style={{
                              backgroundColor: "#fadb14",
                              color: "#000",
                              fontWeight: 600,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${product.id}`);
                            }}
                          >
                            Đặt trước
                          </Button>
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

export default ComingSoonProductsPage;