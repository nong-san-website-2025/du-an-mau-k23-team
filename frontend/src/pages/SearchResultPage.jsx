import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { productApi } from "../features/products/services/productApi";
import {
  Row,
  Col,
  Input,
  Select,
  Typography,
  Spin,
  Alert,
  Space,
  Pagination,
  message,
  notification,
} from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useCart } from "../features/cart/services/CartContext";
import axiosInstance from "../features/admin/services/axiosInstance";
import "../features/products/styles/UserProductPage.css";
import ProductCard from "../features/products/components/ProductCard";
import Layout from "../Layout/LayoutDefault";
import SellerGrid from "../features/stores/components/SellerGrid";

const { Title, Text } = Typography;
const { Option } = Select;

export default function SearchResultsPage() {
  const location = useLocation(); // 👈 Khai báo trước

  const urlParams = new URLSearchParams(location.search);
  const query = urlParams.get("query") || "";
  const initialCategory = urlParams.get("category") || "";
  const { addToCart, cartItems, updateQuantity } = useCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 16;

  const getProductIdFromCartItem = (item) => {
    // Ưu tiên product_data.id (nếu có)
    if (item.product_data?.id != null) return item.product_data.id;
    // Nếu product là object
    if (item.product?.id != null) return item.product.id;
    // Nếu product là số nguyên hoặc chuỗi
    if (item.product != null) return item.product;
    return null;
  };

  // Load categories + products + search
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Lấy categories và toàn bộ sản phẩm giống UserProductPage
        const categoriesData = await productApi.getCategoriesWithProducts();
        setCategories(categoriesData);

        const allProducts = categoriesData.flatMap(
          (cat) => cat.subcategories?.flatMap((sub) => sub.products) || []
        );

        // Lọc sản phẩm theo từ khoá query (nếu có)
        const filteredByQuery = query
          ? allProducts.filter((p) =>
              p.name.toLowerCase().includes(query.toLowerCase())
            )
          : allProducts;

        setProducts(filteredByQuery);

        // Lấy danh sách cửa hàng liên quan đến query
        if (query) {
          const res = await axiosInstance.get("/products/search/", {
            params: { q: query },
          });
          setSellers(res.data?.sellers || []);
        } else {
          setSellers([]);
        }
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  // Subcategories khi chọn danh mục
  const subcategoriesForSelected = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = categories.find((c) => c.name === selectedCategory);
    return cat?.subcategories || [];
  }, [categories, selectedCategory]);

  // Lấy brand duy nhất
  const uniqueBrands = useMemo(() => {
    const set = new Set();
    products
      .filter((p) => !selectedCategory || p.category_name === selectedCategory)
      .forEach((p) => p.brand && set.add(p.brand.trim()));
    return Array.from(set);
  }, [products, selectedCategory]);

  // Lấy location duy nhất
  const uniqueLocations = useMemo(() => {
    const set = new Set();
    products
      .filter((p) => !selectedCategory || p.category_name === selectedCategory)
      .forEach((p) => p.location && set.add(p.location.trim()));
    return Array.from(set);
  }, [products, selectedCategory]);

  // Filter sản phẩm giống UserProductPage
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

  // Pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    selectedLocation,
    priceRange,
  ]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();

    const existingItem = cartItems.find(
      (item) => String(getProductIdFromCartItem(item)) === String(product.id)
    );

    if (existingItem) {
      // 👉 Cập nhật số lượng
      await updateQuantity(
        existingItem.id || existingItem.product,
        existingItem.quantity + 1
      );
      notification.success({
            message: "Đã câp nhật số lượng trong giỏ hàng!",
            placement: "topRight",
            duration: 2,
          });
      return;
    }

    // 👉 Thêm mới
    await addToCart(product.id, 1, {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image?.startsWith("http")
        ? product.image
        : product.image?.startsWith("/")
          ? `http://localhost:8000${product.image}`
          : "",
    });
  };

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <Layout>
      <Row gutter={[16, 16]}>
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
                onChange={(e) =>
                  setPriceRange([Number(e.target.value), priceRange[1]])
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Number(e.target.value)])
                }
              />
            </Space>
          </Space>
        </Col>

        {/* Main Content */}
        <Col xs={24} md={18}>
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 50 }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Sellers */}
              <Title level={5}>
                CỬA HÀNG LIÊN QUAN ĐẾN "
                <span style={{ color: "green" }}>{query}</span>"
              </Title>
              <SellerGrid sellers={sellers} />

              {/* Products */}
              <Title level={5}>
                SẢN PHẨM LIÊN QUAN ĐẾN "
                <span style={{ color: "green" }}>{query}</span>"
              </Title>
              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: 50,
                    color: "#888",
                  }}
                >
                  <AppstoreOutlined style={{ fontSize: 64 }} />
                  <Text>Không có sản phẩm nào</Text>
                </div>
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    {paginatedProducts.map((product) => (
                      <Col
                        key={product.id}
                        xs={24}
                        sm={12}
                        md={12}
                        lg={8}
                        xl={6}
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={(e, prod) => handleAddToCart(e, prod)}
                          showAddToCart={true}
                        />
                      </Col>
                    ))}
                  </Row>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: 16,
                    }}
                  >
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
            </>
          )}
        </Col>
      </Row>
    </Layout>
  );
}
