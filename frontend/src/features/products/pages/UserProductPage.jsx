import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../cart/services/CartContext";
import { productApi } from "../services/productApi";
import {
  Row,
  Col,
  Input,
  Select,
  Card,
  Button,
  Typography,
  Spin,
  Alert,
  Rate,
  Space,
  Pagination,
  message,
} from "antd";
import { ShoppingCartOutlined, AppstoreOutlined } from "@ant-design/icons";
import "../styles/UserProductPage.css";

const { Title, Text } = Typography;
const { Option } = Select;

const UserProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, cartItems, updateQuantity } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 16;


  const filteredByCategory = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category_name === selectedCategory);
  }, [products, selectedCategory]);

  const uniqueBrands = useMemo(() => {
    const set = new Set();
    filteredByCategory.forEach((p) => p.brand && set.add(p.brand.trim()));
    return Array.from(set);
  }, [filteredByCategory]);

  const uniqueLocations = useMemo(() => {
    const set = new Set();
    filteredByCategory.forEach((p) => p.location && set.add(p.location.trim()));
    return Array.from(set);
  }, [filteredByCategory]);

  const subcategoriesForSelected = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = categories.find((c) => c.name === selectedCategory);
    return cat?.subcategories || [];
  }, [categories, selectedCategory]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const categoriesData = await productApi.getCategoriesWithProducts();
        setCategories(categoriesData);
        const allProducts = categoriesData.flatMap(
          (cat) => cat.subcategories?.flatMap((sub) => sub.products) || []
        );
        setProducts(allProducts);

        // Prefill selected category from query param
        const params = new URLSearchParams(location.search);
        const categoryFromQuery = params.get("category");
        if (categoryFromQuery) {
          // If query is a key, map to the category name for the Select/filter logic
          const byKey = categoriesData.find((c) => c.key === categoryFromQuery);
          if (byKey) {
            setSelectedCategory(byKey.name);
          } else {
            // Otherwise, try matching by name
            const byNameExact = categoriesData.find((c) => c.name === categoryFromQuery);
            if (byNameExact) {
              setSelectedCategory(byNameExact.name);
            } else {
              const byNameCI = categoriesData.find(
                (c) => c.name?.toLowerCase() === categoryFromQuery.toLowerCase()
              );
              if (byNameCI) setSelectedCategory(byNameCI.name);
            }
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.search]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    const existingItem = cartItems.find(
      (i) => i.product === product.id || i.product_data?.id === product.id
    );
    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + 1);
      message.success("Đã cập nhật số lượng trong giỏ hàng!");
      return;
    }

    await addToCart(
      product.id,
      1,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image:
          product.image && product.image.startsWith("/")
            ? `http://localhost:8000${product.image}`
            : product.image?.startsWith("http")
            ? product.image
            : "",
      },
      () => message.success("Đã cập nhật số lượng trong giỏ hàng!"),
      () => message.error("Không thể thêm vào giỏ hàng")
    );
  };

  const filteredProducts = products.filter((p) => {
    return (
      (!selectedCategory || p.category_name === selectedCategory) &&
      (!selectedSubcategory || p.subcategory_name === selectedSubcategory) &&
      (!selectedBrand || p.brand === selectedBrand) &&
      (!selectedLocation || p.location === selectedLocation) &&
      p.price >= priceRange[0] &&
      p.price <= priceRange[1] &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSubcategory, selectedBrand, selectedLocation, priceRange]);

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ padding: "12px 120px" }}>
      {/* Sidebar */}
      <Col xs={24} md={6}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Title level={5}>Bộ lọc</Title>
          <Select
            placeholder="Danh mục" 
            value={selectedCategory || undefined}
            onChange={(value) => {
              setSelectedCategory(value);
              setSelectedSubcategory("");
            }}
            style={{ width: "100%" }}
            allowClear
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.name}>
                {cat.name}
              </Option>
            ))}
          </Select>
          {selectedCategory && (
            <Select
              placeholder="Danh mục con"
              value={selectedSubcategory || undefined}
              onChange={(value) => setSelectedSubcategory(value)}
              style={{ width: "100%" }}
              allowClear
            >
              {subcategoriesForSelected.map((sub) => (
                <Option key={sub.id} value={sub.name}>
                  {sub.name}
                </Option>
              ))}
            </Select>
          )}
          <Select
            placeholder="Thương hiệu"
            value={selectedBrand || undefined}
            onChange={(value) => setSelectedBrand(value)}
            style={{ width: "100%" }}
            allowClear
          >
            {uniqueBrands.map((b) => (
              <Option key={b} value={b}>
                {b}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Vị trí"
            value={selectedLocation || undefined}
            onChange={(value) => setSelectedLocation(value)}
            style={{ width: "100%" }}
            allowClear
          >
            {uniqueLocations.map((l) => (
              <Option key={l} value={l}>
                {l}
              </Option>
            ))}
          </Select>
          <Space>
            <Input
              type="number"
              placeholder="Min"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            />
            <Input
              type="number"
              placeholder="Max"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            />
          </Space>
        </Space>
      </Col>

      {/* Product Grid */}
      <Col xs={24} md={18}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 50 }}>
            <Spin size="large" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 50, color: "#888" }}>
            <AppstoreOutlined style={{ fontSize: 64 }} />
            <Text>Không có sản phẩm nào</Text>
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {paginatedProducts.map((product) => (
                <Col key={product.id} xs={24} sm={12} md={12} lg={8} xl={6}>
                  <Card
                    hoverable
                    cover={
                      <img
                        alt={product.name}
                        src={
                          product.image && product.image.startsWith("/")
                            ? `http://localhost:8000${product.image}`
                            : product.image?.startsWith("http")
                            ? product.image
                            : "https://via.placeholder.com/400x300?text=No+Image"
                        }
                        style={{ height: 160, objectFit: "cover" }}
                      />
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
                          <Rate
                            disabled
                            allowHalf
                            defaultValue={product.rating || 0}
                            style={{ fontSize: 14 }}
                          />
                          <Text style={{ marginLeft: 4 }} type="secondary">
                            ({product.review_count || 0})
                          </Text>
                          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text type="danger" strong>
                              {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
                            </Text>
                            <Button
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
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredProducts.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Col>
    </Row>
  );
};

export default UserProductPage;
