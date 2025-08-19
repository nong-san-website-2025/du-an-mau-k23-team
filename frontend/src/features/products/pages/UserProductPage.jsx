import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useCart } from "../../cart/services/CartContext";
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
import { useSearchParams, useNavigate } from "react-router-dom";
import { productApi } from "../services/productApi";

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
   const { addToCart, cartItems, updateQuantity } = useCart();
  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSub, setActiveSub] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const categoriesData = await productApi.getCategoriesWithProducts();
        setCategories(categoriesData);

        let categoryToSelect = categoriesData[0] || null;
        if (categoryParam) {
          const foundCategory = categoriesData.find(
            (cat) => cat.name === categoryParam || cat.key === categoryParam
          );
          if (foundCategory) categoryToSelect = foundCategory;
        }
        setSelectedCategory(categoryToSelect);

        if (categoryToSelect && subcategoryParam) {
          setActiveSub(subcategoryParam);
        } else {
          setActiveSub("Tất cả");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryParam, subcategoryParam]);

  const handleAddToCart = async (e, product) => {
  e.stopPropagation();

  // ✅ Kiểm tra nếu sản phẩm đã tồn tại trong giỏ thì update số lượng
  const existingItem = cartItems.find(
    (i) => i.product === product.id || i.product_data?.id === product.id
  );
  if (existingItem) {
    await updateQuantity(existingItem.id, existingItem.quantity + 1);
    toast.success("Đã cập nhật số lượng trong giỏ hàng!", { autoClose: 1500 });
    return;
  }

  // ✅ Nếu chưa có thì gọi addToCart như bình thường
  await addToCart(
    product.id,
    1,
    () => toast.success("Đã thêm vào giỏ hàng!", { autoClose: 1500, position: "bottom-right" }),
    (err) => {
      if (err.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng", {position: "bottom-right"});
      } else {
        toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.", {position: "bottom-right"});
      }
    },
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
    }
  );
};

  if (error) {
    return (
      <div className="container py-4 text-center">
        <Alert variant="danger">
          <Alert.Heading>Lỗi khi tải dữ liệu</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </Alert>
      </div>
    );
  }

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

  const filteredProducts =
    activeSub === "Tất cả"
      ? allProducts
      : selectedCategory?.subcategories?.find((s) => s.name === activeSub)
          ?.products || [];

  const displayedProducts = filteredProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4">

      {/* Header */}
      <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge bg="success">
            Dữ liệu từ Backend API - {categories.length} danh mục
          </Badge>
          <Badge bg="info">{allProducts.length} sản phẩm</Badge>
        </div>
        <Form style={{ maxWidth: 260 }}>
          <Form.Control
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form>
      </div>

      {/* Tabs danh mục */}
      <div className="d-flex flex-wrap gap-2 mb-3">
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
              size="sm"
              onClick={() => {
                setSelectedCategory(cat);
                setActiveSub("Tất cả");
                setSearchParams({ category: cat.key || cat.name });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <IconComponent size={14} className="me-1" />
              {cat.name}
              <Badge bg="secondary" className="ms-1">
                {totalProducts}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Subcategory Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button
          variant={activeSub === "Tất cả" ? "dark" : "light"}
          size="sm"
          onClick={() => {
            setActiveSub("Tất cả");
            setSearchParams({
              category: selectedCategory?.key || selectedCategory?.name,
            });
          }}
        >
          Tất cả
          <Badge bg="secondary" className="ms-1">
            {allProducts.length}
          </Badge>
        </Button>
        {selectedCategory?.subcategories?.map((sub) => (
          <Button
            key={sub.name}
            variant={activeSub === sub.name ? "dark" : "light"}
            size="sm"
            onClick={() => {
              setActiveSub(sub.name);
              setSearchParams({
                category: selectedCategory?.key || selectedCategory?.name,
                subcategory: sub.name,
              });
            }}
          >
            {sub.name}
            <Badge bg="secondary" className="ms-1">
              {sub.products?.length || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Đang tải sản phẩm...</p>
        </div>
      ) : displayedProducts.length === 0 ? (
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
        <Row xs={2} sm={3} md={4} lg={5} xl={6} className="g-3">
          {displayedProducts.map((product) => (
            <Col key={product.id}>
              <Card
                className="h-100 shadow-sm border-0"
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-5px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  className="position-relative"
                  style={{ height: 160, cursor: "pointer", backgroundColor: "#f8f9fa" }}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
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
                    style={{ height: "100%", objectFit: "cover" }}
                  />
                  {product.is_organic && (
                    <Badge bg="success" className="position-absolute top-0 start-0 m-2">
                      Hữu cơ
                    </Badge>
                  )}
                  {product.is_best_seller && (
                    <Badge bg="warning" text="dark" className="position-absolute top-0 start-50 translate-middle-x m-2">
                      Bán chạy
                    </Badge>
                  )}
                  {product.is_new && (
                    <Badge bg="info" className="position-absolute top-0 end-0 m-2">
                      Mới
                    </Badge>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fs-6 fw-semibold text-truncate" title={product.name}>
                    {product.name}
                  </Card.Title>
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
                      ({product.review_count || 0})
                    </small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="fw-bold text-danger">
                      {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
                    </span>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
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
