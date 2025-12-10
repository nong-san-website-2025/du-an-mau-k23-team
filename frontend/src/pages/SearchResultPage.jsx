import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { productApi } from "../features/products/services/productApi";
import {
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Pagination,
  notification,
} from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useCart } from "../features/cart/services/CartContext";
import axiosInstance from "../features/admin/services/axiosInstance";
import "../features/products/styles/UserProductPage.css";
import ProductCard from "../features/products/components/ProductCard";
import Layout from "../Layout/LayoutDefault";
import SellerGrid from "../features/stores/components/SellerGrid";
import FilterSidebar from "../features/products/components/FilterSidebar";
import { useProductFilters } from "../features/products/hooks/useProductFilters";
import { getProductIdFromCartItem } from "../features/products/utils/productUtils";

const { Title, Text } = Typography;

export default function SearchResultsPage() {
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const query = urlParams.get("query") || "";
  const initialCategory = urlParams.get("category") || "";
  const initialSubcategory = urlParams.get("subcategory") || "";
  const { addToCart, cartItems, updateQuantity } = useCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    selectedBrand,
    setSelectedBrand,
    selectedLocation,
    setSelectedLocation,
    priceRange,
    setPriceRange,
    currentPage,
    setCurrentPage,
    uniqueBrands,
    uniqueLocations,
    subcategoriesForSelected,
    filteredProducts,
    paginatedProducts,
    resetFilters,
    pageSize: PAGE_SIZE,
  } = useProductFilters(products, categories, {
    enableAccentRemoval: true,
    pageSize: 16,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const categoriesData = await productApi.getCategoriesWithProducts();
        setCategories(categoriesData);

        const allProducts = categoriesData.flatMap(
          (cat) => cat.subcategories?.flatMap((sub) => sub.products) || []
        );

        setProducts(allProducts);
        setSearch(query);
        setSelectedCategory(initialCategory);
        
        if (initialSubcategory) {
          const decodedSubcategory = decodeURIComponent(initialSubcategory);
          setSelectedSubcategory(decodedSubcategory);
        }

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
  }, [query, initialCategory, initialSubcategory, setSearch, setSelectedCategory, setSelectedSubcategory]);

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
          ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${product.image}`
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
        <Col xs={24} md={6}>
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSubcategoryChange={setSelectedSubcategory}
            subcategoriesForSelected={subcategoriesForSelected}
            uniqueBrands={uniqueBrands}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            uniqueLocations={uniqueLocations}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            onReset={resetFilters}
            search={search}
            onSearchChange={setSearch}
          />
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
