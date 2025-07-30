import React, { useState, useEffect } from "react";
import {
  Carrot,
  Apple,
  Wheat,
  Beef,
  Milk,
  Coffee,
  ChevronLeft,
  Star,
  Star as StarFill,
  ShoppingCart,
  Banana,
  Package,
} from "lucide-react";
import {
  Card,
  Button,
  Row,
  Col,
  Badge,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { productApi } from "../services/productApi";

// Icon mapping cho API data
const iconMap = {
  Carrot: Carrot,
  Apple: Apple,
  Wheat: Wheat,
  Beef: Beef,
  Milk: Milk,
  Coffee: Coffee,
  Package: Package,
  Banana: Banana,
};

const UserProductPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");

  // States
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSub, setActiveSub] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dữ liệu từ API khi component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const categoriesData = await productApi.getCategoriesWithProducts();
        setCategories(categoriesData);

        // Tự động chọn category theo URL param hoặc đầu tiên
        let categoryToSelect = categoriesData[0] || null;
        if (categoryParam) {
          const foundCategory = categoriesData.find(
            (cat) => cat.name === categoryParam || cat.key === categoryParam
          );
          if (foundCategory) {
            categoryToSelect = foundCategory;
          }
        }
        setSelectedCategory(categoryToSelect);

        // Nếu có subcategory trên URL thì set luôn
        if (categoryToSelect && subcategoryParam) {
          setActiveSub(subcategoryParam);
        } else {
          setActiveSub("Tất cả");
        }

        console.log("Đã tải được categories từ API:", categoriesData);
      } catch (err) {
        setError(err.message);
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryParam, subcategoryParam]);

  // Cập nhật URL khi chọn category
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setActiveSub("Tất cả");
    setSearchParams({ category: category.key || category.name });
  };

  // Hiển thị loading
  if (loading) {
    return (
      <div className="container py-4 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Đang tải dữ liệu từ backend...</p>
      </div>
    );
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <div className="container py-4 text-center">
        <Alert variant="danger">
          <Alert.Heading>Lỗi khi tải dữ liệu</Alert.Heading>
          <p>{error}</p>
          <Button
            variant="outline-danger"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </Alert>
      </div>
    );
  }

  // Không có dữ liệu
  if (!selectedCategory || categories.length === 0) {
    return (
      <div className="container py-4 text-center">
        <Alert variant="info">
          <Alert.Heading>Chưa có dữ liệu</Alert.Heading>
          <p>Hiện tại chưa có danh mục sản phẩm nào trong hệ thống.</p>
        </Alert>
      </div>
    );
  }

  const allProducts =
    selectedCategory?.subcategories?.flatMap((sub) => sub.products) || [];

  // Lọc sản phẩm theo subcategory
  const filteredProducts =
    activeSub === "Tất cả"
      ? allProducts
      : selectedCategory?.subcategories?.find((s) => s.name === activeSub)
          ?.products || [];

  // Lọc theo search
  const displayedProducts = filteredProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4">
      {/* Header với thông tin API */}
      <div className="mb-3 d-flex align-items-center gap-3">
        <Badge bg="success">
          Dữ liệu từ Backend API - {categories.length} danh mục
        </Badge>
        <Badge bg="info">{allProducts.length} sản phẩm</Badge>
      </div>

      {/* Thanh tìm kiếm */}
      <Form className="mb-3">
        <Form.Control
          type="search"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 350 }}
        />
      </Form>

      {/* Tabs danh mục cha */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Package;
          const isSelected = cat.id === selectedCategory?.id;
          const totalProducts =
            cat.subcategories?.reduce(
              (sum, s) => sum + (s.products?.length || 0),
              0
            ) || 0;

          return (
            <Button
              key={cat.id}
              variant={isSelected ? "dark" : "light"}
              className={isSelected ? "fw-bold" : ""}
              onClick={() => {
                setSelectedCategory(cat);
                setActiveSub("Tất cả");
                setSearchParams({ category: cat.key || cat.name });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <IconComponent size={16} className="me-1" />
              {cat.name} {" "}
              <Badge bg="secondary" className="ms-1">
                {totalProducts}
              </Badge>
            </Button>
          );
        })}
      </div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Button
          variant={activeSub === "Tất cả" ? "dark" : "light"}
          className={activeSub === "Tất cả" ? "fw-bold" : ""}
          onClick={() => {
            setActiveSub("Tất cả");
            setSearchParams({ category: selectedCategory?.key || selectedCategory?.name });
          }}
        >
          Tất cả{" "}
          <Badge bg="secondary" className="ms-1">
            {allProducts.length}
          </Badge>
        </Button>
        {selectedCategory?.subcategories?.map((sub) => (
          <Button
            key={sub.name}
            variant={activeSub === sub.name ? "dark" : "light"}
            className={activeSub === sub.name ? "fw-bold" : ""}
            onClick={() => {
              setActiveSub(sub.name);
              setSearchParams({
                category: selectedCategory?.key || selectedCategory?.name,
                subcategory: sub.name,
              });
            }}
          >
            {sub.name} {" "}
            <Badge bg="secondary" className="ms-1">
              {sub.products?.length || 0}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="mb-2 text-muted">
        Hiển thị {displayedProducts.length} sản phẩm trong danh mục "
        <b>{selectedCategory?.name}</b>"
        {activeSub !== "Tất cả" && ` - ${activeSub}`}
        <Badge bg="success" className="ms-2">
          API Data
        </Badge>
      </div>

      {/* Danh sách sản phẩm */}
      {displayedProducts.length === 0 ? (
        <div className="text-center py-5">
          <Package size={64} className="text-muted mb-3" />
          <h5 className="text-muted">Không có sản phẩm nào</h5>
          <p className="text-muted">
            {search
              ? `Không tìm thấy sản phẩm với từ khóa "${search}"`
              : "Danh mục này chưa có sản phẩm"}
          </p>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {displayedProducts.map((product) => (
            <Col key={product.id}>
              <Card className="h-100 shadow-sm border-0">
                <div className="position-relative" style={{ height: 210, cursor: 'pointer' }}
                  onClick={() => navigate(`/products/${product.id}`)}>
                  <Card.Img
                    variant="top"
                    src={
                      product.image && product.image.startsWith("/")
                        ? `http://localhost:8000${product.image}`
                        : product.image?.startsWith("http")
                        ? product.image
                        : "https://via.placeholder.com/400x300?text=No+Image"
                    }
                    alt={product.name}
                    style={{
                      height: 180,
                      objectFit: "cover",
                      borderRadius: "1rem 1rem 0 0",
                    }}
                  />
                  {(product.discount || 0) > 0 && (
                    <Badge
                      bg="danger"
                      className="position-absolute top-0 start-0 m-2"
                    >
                      -{product.discount}%
                    </Badge>
                  )}
                  {product.is_organic && (
                    <Badge
                      bg="success"
                      className="position-absolute top-0 start-50 translate-middle-x m-2"
                    >
                      Hữu cơ
                    </Badge>
                  )}
                  {product.is_best_seller && (
                    <Badge
                      bg="warning"
                      className="position-absolute top-0 end-0 m-2 text-white"
                    >
                      Bán chạy
                    </Badge>
                  )}
                  {product.is_new && (
                    <Badge
                      bg="info"
                      className="position-absolute bottom-0 start-0 m-2"
                    >
                      Mới
                    </Badge>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fs-6 mb-2">{product.name}</Card.Title>
                  <Card.Text className="text-muted small mb-2 flex-grow-1">
                    {product.description}
                  </Card.Text>

                  {/* Rating */}
                  <div className="d-flex align-items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>
                        {i < Math.floor(product.rating || 0) ? (
                          <StarFill size={14} className="text-warning" />
                        ) : (
                          <Star size={14} className="text-muted" />
                        )}
                      </span>
                    ))}
                    <small className="text-muted ms-1">
                      ({product.review_count || product.reviewCount || 0})
                    </small>
                  </div>

                  {/* Brand và Location */}
                  <div className="mb-2">
                    {product.brand && (
                      <Badge bg="light" text="dark" className="me-1">
                        {product.brand}
                      </Badge>
                    )}
                    {product.location && (
                      <Badge bg="light" text="dark">
                        📍 {product.location}
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {(product.discount || 0) > 0 ? (
                        <>
                          <span className="fw-bold text-danger">
                            {(
                              product.price *
                              (1 - (product.discount || 0) / 100)
                            ).toLocaleString("vi-VN")}
                            đ
                          </span>
                          <small className="text-muted text-decoration-line-through ms-1">
                            {product.price?.toLocaleString("vi-VN")}đ
                          </small>
                        </>
                      ) : (
                        <span className="fw-bold">
                          {product.price?.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                      <small className="text-muted">/{product.unit}</small>
                    </div>
                    <Button variant="outline-success" size="sm">
                      <ShoppingCart size={16} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default UserProductPage;
