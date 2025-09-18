import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../features/admin/services/axiosInstance.js";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Tag,
  Spin,
  Typography,
  Space,
} from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";

const { Title, Text } = Typography;

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState({
    products: [],
    sellers: [],
    posts: [],
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: "",
    categoryKey: "",
    subcategoryName: "",
    priceMin: "",
    priceMax: "",
    brand: "",
    location: "",
    ratingMin: "",
    inStock: false,
    sort: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState(null);

  const query = new URLSearchParams(location.search).get("query");

  // Load search results
  useEffect(() => {
    if (!query) return;
    setLoading(true);
    axiosInstance
      .get(`/products/search/`, { params: { q: query } })
      .then((res) =>
        setResults({
          products: res.data.products || [],
          sellers: res.data.sellers || [],
          posts: res.data.posts || [],
        })
      )
      .catch(() => setError("Không thể tải kết quả tìm kiếm."))
      .finally(() => setLoading(false));
  }, [query]);

  // Load categories
  useEffect(() => {
    setLoadingCategories(true);
    axiosInstance
      .get("/products/categories/")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    const selected = categories.find(
      (c) => String(c.id) === String(filters.categoryId)
    );
    const newKey = selected?.key || "";
    if (newKey !== filters.categoryKey) {
      setFilters((prev) => ({ ...prev, categoryKey: newKey }));
    }

    if (!selected?.id) return setSubcategories([]);
    axiosInstance
      .get(`/products/categories/${selected.id}/subcategories/`)
      .then((res) => setSubcategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSubcategories([]));
  }, [filters.categoryId, categories]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    // Reset legacy filters (kept for compatibility)
    setFilters({
      categoryId: "",
      categoryKey: "",
      subcategoryName: "",
      priceMin: "",
      priceMax: "",
      brand: "",
      location: "",
      ratingMin: "",
      inStock: false,
      sort: "",
    });
    // Reset new UI filters (match UserProductPage)
    setSearch("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedBrand("");
    setSelectedLocation("");
    setPriceRange([0, 1000000]);
  };

  // New filter states (match UserProductPage style)
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  // Helpers
  const categoryById = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => {
      map[String(c.id)] = c;
    });
    return map;
  }, [categories]);

  const subcategoriesForSelected = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = (categories || []).find((c) => c.name === selectedCategory);
    return cat?.subcategories || [];
  }, [categories, selectedCategory]);

  const filteredByCategory = useMemo(() => {
    if (!selectedCategory) return results.products || [];
    return (results.products || []).filter((p) => {
      const cat = categoryById[String(p.category)];
      return cat && cat.name === selectedCategory;
    });
  }, [results.products, selectedCategory, categoryById]);

  const uniqueBrands = useMemo(() => {
    const set = new Set();
    (filteredByCategory || []).forEach((p) => p.brand && set.add(String(p.brand).trim()));
    return Array.from(set);
  }, [filteredByCategory]);

  const uniqueLocations = useMemo(() => {
    const set = new Set();
    (filteredByCategory || []).forEach((p) => p.location && set.add(String(p.location).trim()));
    return Array.from(set);
  }, [filteredByCategory]);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (selectedCategory) chips.push({ key: "category", label: `Danh mục: ${selectedCategory}` });
    if (selectedSubcategory) chips.push({ key: "subcategory", label: `Nhóm: ${selectedSubcategory}` });
    if (selectedBrand) chips.push({ key: "brand", label: `Thương hiệu: ${selectedBrand}` });
    if (selectedLocation) chips.push({ key: "location", label: `Khu vực: ${selectedLocation}` });
    if (priceRange[0] > 0) chips.push({ key: "priceMin", label: `Giá từ ${Number(priceRange[0]).toLocaleString()}đ` });
    if (priceRange[1] < 1000000) chips.push({ key: "priceMax", label: `Đến ${Number(priceRange[1]).toLocaleString()}đ` });
    if (search) chips.push({ key: "search", label: `Từ khóa: ${search}` });
    return chips;
  }, [selectedCategory, selectedSubcategory, selectedBrand, selectedLocation, priceRange, search]);

  const removeFilter = (key) => {
    switch (key) {
      case "category":
        setSelectedCategory("");
        setSelectedSubcategory("");
        break;
      case "subcategory":
        setSelectedSubcategory("");
        break;
      case "brand":
        setSelectedBrand("");
        break;
      case "location":
        setSelectedLocation("");
        break;
      case "priceMin":
        setPriceRange(([_, max]) => [0, max]);
        break;
      case "priceMax":
        setPriceRange(([min, _]) => [min, 1000000]);
        break;
      case "search":
        setSearch("");
        break;
      default:
        break;
    }
  };

  const formatPrice = (n) => Number(n || 0).toLocaleString() + " đ";

  // Lọc sản phẩm theo UI giống UserProductPage
  const filteredProducts = useMemo(() => {
    let data = results.products || [];

    if (selectedCategory) {
      data = data.filter((p) => {
        const cat = categoryById[String(p.category)];
        return cat && cat.name === selectedCategory;
      });
    }

    if (selectedSubcategory) {
      const sub = subcategoriesForSelected.find((s) => s.name === selectedSubcategory);
      const subId = sub?.id;
      if (subId) {
        data = data.filter((p) => String(p.subcategory) === String(subId));
      }
    }

    if (selectedBrand) data = data.filter((p) => p.brand === selectedBrand);
    if (selectedLocation) data = data.filter((p) => p.location === selectedLocation);
    data = data.filter((p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);
    if (search) data = data.filter((p) => (p.name || '').toLowerCase().includes(search.toLowerCase()));

    return data;
  }, [results.products, selectedCategory, selectedSubcategory, selectedBrand, selectedLocation, priceRange, search, categoryById]);
  return (
    <div className="container mt-4">
      <Helmet>
        <title>{query} giá tốt tại GreenFarm</title>
      </Helmet>

      {(loading || loadingProducts) && (
        <div className="text-center my-4">
          <Spin tip="Đang tải kết quả..." size="large" />
        </div>
      )}

      {error && <Text type="danger">{error}</Text>}

      {/* Active filter tags */}
      {activeFilters.length > 0 && (
        <Space wrap className="mb-3">
          {activeFilters.map((f) => (
            <Tag key={f.key} closable onClose={() => removeFilter(f.key)}>
              {f.label}
            </Tag>
          ))}
          <Button type="link" size="small" onClick={clearFilters}>
            Xóa tất cả
          </Button>
        </Space>
      )}

      <Row gutter={[16, 16]}>
        {/* Sidebar Filter */}
        <Col xs={24} md={6}>
          <Card title="Bộ lọc sản phẩm" bordered={false}>
            {loadingCategories ? (
              <div className="text-center">
                <Spin size="small" />
              </div>
            ) : (
              <Form layout="vertical">
                <Space direction="vertical" style={{ width: "100%" }} size="middle">

                  <Select
                    placeholder="Danh mục"
                    value={selectedCategory || undefined}
                    onChange={(value) => {
                      setSelectedCategory(value);
                      setSelectedSubcategory("");
                    }}
                    allowClear
                  >
                    {categories.map((cat) => (
                      <Select.Option key={cat.id} value={cat.name}>
                        {cat.name}
                      </Select.Option>
                    ))}
                  </Select>
                  {selectedCategory && (
                    <Select
                      placeholder="Danh mục con"
                      value={selectedSubcategory || undefined}
                      onChange={(value) => setSelectedSubcategory(value)}
                      allowClear
                    >
                      {subcategoriesForSelected.map((sub) => (
                        <Select.Option key={sub.id} value={sub.name}>
                          {sub.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                  <Select
                    placeholder="Thương hiệu"
                    value={selectedBrand || undefined}
                    onChange={(value) => setSelectedBrand(value)}
                    allowClear
                  >
                    {uniqueBrands.map((b) => (
                      <Select.Option key={b} value={b}>
                        {b}
                      </Select.Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Vị trí"
                    value={selectedLocation || undefined}
                    onChange={(value) => setSelectedLocation(value)}
                    allowClear
                  >
                    {uniqueLocations.map((l) => (
                      <Select.Option key={l} value={l}>
                        {l}
                      </Select.Option>
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
              </Form>
            )}
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} md={18}>
          {/* Sellers */}
          <Title level={5}>
            CỬA HÀNG LIÊN QUAN ĐẾN "
            <span style={{ color: "green" }}>{query}</span>"
          </Title>
          <Row gutter={[16, 16]} className="mb-4">
            {results.sellers.length === 0 ? (
              <Text type="secondary">Không tìm thấy cửa hàng nào phù hợp.</Text>
            ) : (
              results.sellers.map((seller) => (
                <Col xs={24} sm={12} md={8} lg={6} key={seller.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/store/${seller.id}`)}
                    title={seller.store_name}
                    size="small"
                  >
                    <Text type="secondary">
                      {seller.description || "Chưa có mô tả"}
                    </Text>
                  </Card>
                </Col>
              ))
            )}
          </Row>

          {/* Products */}
          <Title level={5}>
            SẢN PHẨM LIÊN QUAN ĐẾN "
            <span style={{ color: "green" }}>{query}</span>"
          </Title>
          <Row gutter={[16, 16]}>
            {results.products.length === 0 ? (
              <Text type="secondary">Không tìm thấy sản phẩm nào phù hợp.</Text>
            ) : (
              filteredProducts.map((product) => (
                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                  <Card
                    hoverable
                    cover={
                      <img
                        src={
                          product.image?.startsWith("http")
                            ? product.image
                            : product.image
                              ? `${process.env.REACT_APP_API_BASE || ""}/${product.image}`
                              : "https://via.placeholder.com/300x200?text=No+Image"
                        }
                        alt={product.name}
                        style={{ height: 180, objectFit: "cover" }}
                      />
                    }
                  >
                    {Number(product.stock || 0) <= 0 && (
                      <Tag
                        color="gray"
                        style={{ position: "absolute", top: 8, left: 8 }}
                      >
                        Hết hàng
                      </Tag>
                    )}
                    {Number(product.review_count || 0) > 50 && (
                      <Tag
                        color="gold"
                        style={{ position: "absolute", top: 8, right: 8 }}
                      >
                        Bán chạy
                      </Tag>
                    )}

                    <Card.Meta
                      title={product.name}
                      description={
                        <>
                          <Text type="secondary">⭐ {product.rating ?? 0}</Text>
                          {product.brand && (
                            <Text type="secondary"> • {product.brand}</Text>
                          )}
                          {product.location && (
                            <Text type="secondary">
                              <br />
                              Khu vực: {product.location}
                            </Text>
                          )}
                          <Text
                            type="danger"
                            strong
                            style={{ display: "block", marginTop: 4 }}
                          >
                            {formatPrice(product.price)}
                          </Text>
                        </>
                      }
                    />
                    <Button
                      type="default"
                      icon={<ShoppingCartOutlined />}
                      style={{ marginTop: 8 }}
                      block
                      onClick={(e) => e.stopPropagation() /* Thêm giỏ hàng */}
                    >
                      Thêm vào giỏ
                    </Button>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Col>
      </Row>
    </div>
  );
}
