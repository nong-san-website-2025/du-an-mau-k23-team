// src/pages/BestSellersPage.jsx
import React, { useEffect, useState } from "react";
import { Row, Col, Spin, Alert, Pagination, Typography } from "antd";
import { FireOutlined, TrophyOutlined } from "@ant-design/icons"; // Đổi icon cho hợp
import { useCart } from "../features/cart/services/CartContext";
import { productApi } from "../features/products/services/productApi";
import ProductCard from "../features/products/components/ProductCard";

const { Text } = Typography;

const BestSellersPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 18;

  const { addToCart, cartItems, updateQuantity } = useCart();
  const API_URL = process.env.REACT_APP_API_URL;
  const BASE_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : "http://localhost:8000";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // 1. Gọi API lấy tất cả sản phẩm
        // (Lưu ý: Nếu bạn dùng hàm fetchBestSellers riêng thì nhớ chuẩn hoá dữ liệu giống getAll)
        const data = await productApi.getAll();

        // 2. LOGIC KHÁC BIỆT Ở ĐÂY:
        // Lọc sản phẩm hiển thị & Sắp xếp theo SỐ LƯỢNG ĐÃ BÁN (sold hoặc total_sold)
        const sortedProducts = data
          .filter((p) => p.availability_status !== "hidden")
          .sort((a, b) => {
             // Ưu tiên số lượng bán giảm dần
             const soldA = a.sold || a.total_sold || 0;
             const soldB = b.sold || b.total_sold || 0;
             return soldB - soldA; 
          });

        setProducts(sortedProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- (Phần Pagination và handleAddToCart giữ nguyên y hệt trang cũ) ---
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + productsPerPage);

  const handleAddToCart = async (e, product) => {
    // ... (Giữ nguyên logic add to cart của trang NewProductsPage)
    if (e && e.stopPropagation) e.stopPropagation();
    const getProductId = (item) => item.product_data?.id || (item.product?.id !== undefined ? item.product.id : item.product);
    const existingItem = cartItems.find((item) => String(getProductId(item)) === String(product.id));

    if (existingItem) {
      await updateQuantity(product.id, existingItem.quantity + 1);
      return;
    }

    let imageUrl = product.main_image?.image || product.image || "";
    if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `${BASE_URL}${imageUrl}`;
    }

    await addToCart(product.id, 1, {
      id: product.id,
      name: product.name,
      price: product.discounted_price || product.price,
      image: imageUrl,
    });
  };

  if (error) return <Alert message="Lỗi" description={error} type="error" showIcon />;

  return (
    <div className="responsive-container">
      {/* Header thay đổi nội dung */}
      <div style={{ marginBottom: "28px" }} className="responsive-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 className="responsive-title">
            Top Bán Chạy
          </h2>
          {/* Badge thay đổi màu sắc và nội dung */}
          <span
            style={{
              marginLeft: "12px",
              background: "#fff1f0", // Màu đỏ nhạt
              color: "#f5222d",     // Chữ đỏ đậm
              padding: "2px 10px",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: 600,
              border: "1px solid #ffa39e",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <FireOutlined /> Hot nhất
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 50 }}><Spin size="large" /></div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 50, color: "#888" }}>
          <TrophyOutlined style={{ fontSize: 64 }} />
          <div style={{ marginTop: 10 }}><Text>Chưa có sản phẩm nào lọt top</Text></div>
        </div>
      ) : (
        <>
          <Row gutter={[16, 24]}>
            {currentProducts.map((product, index) => (
              <Col key={product.id} xs={12} sm={12} md={8} lg={6} xl={4} xxl={4}>
                {/* Có thể truyền thêm props 'rank' để hiển thị số 1, 2, 3 nếu muốn */}
                <ProductCard 
                    product={product} 
                    onAddToCart={handleAddToCart}
                    showAddToCart={true}
                />
              </Col>
            ))}
          </Row>
           {/* Pagination giữ nguyên */}
          {totalPages > 1 && (
            <div style={{display: "flex", justifyContent: "center", marginTop: "32px", textAlign: "center" }}>
              <Pagination
                current={currentPage}
                total={products.length}
                pageSize={productsPerPage}
                onChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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

export default BestSellersPage;