import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "../../cart/services/CartContext";
import { productApi } from "../services/productApi";
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
import "../styles/UserProductPage.css";
import ProductCard from "../components/ProductCard";
import Layout from "../../../Layout/LayoutDefault";
import FilterSidebar from "../components/FilterSidebar";
import { useProductFilters } from "../hooks/useProductFilters";
import { getProductIdFromCartItem } from "../utils/productUtils";

const { Text } = Typography;

const UserProductPage = () => {
  const location = useLocation();
  const { addToCart, cartItems, updateQuantity } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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
    enableAccentRemoval: false,
    pageSize: 16,
  });

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

        const params = new URLSearchParams(location.search);
        const categoryFromQuery = params.get("category");
        const subcategoryFromQuery = params.get("subcategory");

        // Set category from URL
        if (categoryFromQuery) {
          const byKey = categoriesData.find((c) => c.key === categoryFromQuery);
          if (byKey) {
            setSelectedCategory(byKey.name);
          } else {
            const byNameExact = categoriesData.find(
              (c) => c.name === categoryFromQuery
            );
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

        // Set subcategory from URL if provided
        if (subcategoryFromQuery) {
          setSelectedSubcategory(subcategoryFromQuery);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.search, setSelectedCategory, setSelectedSubcategory]);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();

    const existingItem = cartItems.find(
      (item) => String(getProductIdFromCartItem(item)) === String(product.id)
    );

    if (existingItem) {
      await updateQuantity(product.id, existingItem.quantity + 1);
      notification.success({
        message: "Đã cập nhật số lượng trong giỏ hàng!",
        placement: "topRight",
        duration: 2,
      });
      return;
    }

    await addToCart(product.id, 1, {
      id: product.id,
      name: product.name,
      price: product.price,
      image:
        product.image && product.image.startsWith("/")
          ? `http://localhost:8000${product.image}`
          : product.image?.startsWith("http")
            ? product.image
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
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart} // ✅ không dùng arrow function nữa
                      // vẫn dùng hàm sẵn có
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
        </Col>
      </Row>
    </Layout>
  );
};

export default UserProductPage;
