import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useCart } from "../../cart/services/CartContext";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Spin,
  Alert,
  Typography,
  Space,
  Input,
  Breadcrumb,
  message,
  notification,
} from "antd";
import ProductImage from "../components/ProductImage";
import ProductInfo from "../components/ProductInfo";
import RelatedProducts from "../components/RelatedProducts";
import StoreCard from "../components/StoreCard";
import ReviewsSection from "../components/ReviewsSection";
import { productApi } from "../services/productApi";
import { reviewApi } from "../services/reviewApi";
import { useAuth } from "../../login_register/services/AuthContext";
import "../styles/ProductDetailPage.css";

const { Title, Text, Paragraph } = Typography;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [categoryName, setCategoryName] = useState("Danh mục");
  const [subcategoryName, setSubcategoryName] = useState("Phân loại");
  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showPreorderModal, setShowPreorderModal] = useState(false);
  const [preorderQty, setPreorderQty] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // SỬA LỖI TĂNG VIEW: Dùng useRef thay vì useState để không gây re-render
  const viewIncremented = useRef(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myReview, setMyReview] = useState(null);

  // Reset trạng thái đếm view khi ID sản phẩm thay đổi (khi user chuyển từ SP này sang SP khác)
  useEffect(() => {
    viewIncremented.current = false;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [id]);

  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [loading]);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const fav = list.some((item) => String(item.id) === String(id));
      setIsFavorite(fav);
    } catch {
      setIsFavorite(false);
    }
  }, [id]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!product) return;

      try {
        const [catRes, subRes] = await Promise.all([
          fetch("http://localhost:8000/api/products/categories/"),
          fetch("http://localhost:8000/api/products/subcategories/"),
        ]);

        const categories = await catRes.json();
        const subcategories = await subRes.json();

        const cat = categories.find((c) => c.id === product.category);
        const sub = subcategories.find((s) => s.id === product.subcategory);

        setCategoryName(cat?.name || "Danh mục");
        setSubcategoryName(sub?.name || "Phân loại");
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
        setCategoryName("Danh mục");
        setSubcategoryName("Phân loại");
      }
    };

    loadCategories();
  }, [product]);

  useEffect(() => {
    const loadRelated = async () => {
      try {
        const all = await productApi.getAllProducts();
        const selected = all.slice(0, 6);
        setRelatedProducts(selected);
      } catch (err) {
        console.error("❌ Lỗi load sản phẩm liên quan:", err);
      }
    };
    loadRelated();
  }, []);

  const handleToggleFavorite = async () => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (isFavorite) {
        const newList = list.filter(
          (item) => String(item.id) !== String(product.id)
        );
        localStorage.setItem("wishlist", JSON.stringify(newList));
        setIsFavorite(false);
        toast.info("Đã xóa khỏi mục yêu thích", {
          position: "bottom-right",
          theme: "light",
        });
      } else {
        const item = {
          id: product.id,
          name: product.name,
          image:
            (product.image && product.image.startsWith("/")
              ? `http://localhost:8000${product.image}`
              : product.image) || "",
          price: Number(product.discounted_price ?? product.price) || 0,
          inStock: product.stock > 0,
        };
        if (!list.some((p) => String(p.id) === String(item.id))) {
          list.push(item);
          localStorage.setItem("wishlist", JSON.stringify(list));
        }
        setIsFavorite(true);
        toast.success("Đã thêm vào mục yêu thích", {
          position: "bottom-right",
          theme: "light",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật mục yêu thích", {
        position: "bottom-right",
      });
    }
  };

  // ✅ Load dữ liệu với kiểm tra quyền truy cập và đếm view chuẩn
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("👉 Bắt đầu load data"); // Log 1
        setError(null);
        
        // 1. Gọi API lấy thông tin sản phẩm (GET)
        const productData = await productApi.getProduct(id);
        
        console.log("✅ Product data loaded:", productData);

        const isProductVisible = productData.status === "approved";

        if (!isProductVisible) {
          setError("Sản phẩm không tồn tại hoặc đã bị khóa.");
          return;
        }

        console.log("👉 Check Ref:", viewIncremented.current); // Log 3

        setProduct(productData);

        // 2. Tăng view (POST) - CHỈ GỌI 1 LẦN DUY NHẤT bằng cách check useRef
        if (!viewIncremented.current) {
          try {
            await fetch(`http://localhost:8000/api/products/${id}/increment-views/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            console.log("👉 Đang gọi API increment-views..."); // Log 4
            // Đánh dấu đã tăng view, useRef thay đổi không gây render lại -> fix lỗi loop
            viewIncremented.current = true; 
          } catch (viewError) {
            console.warn('Could not increment product views:', viewError);
          }
        }

        const reviewList = await reviewApi.getReviews(id);
        setReviews(reviewList);

        if (user) {
          const myReview = await reviewApi.getMyReview(id).catch(() => null);
          setMyReview(myReview);
          setHasReviewed(!!myReview);
        }
      } catch (err) {
        console.error("Load product error:", err);
        setError("Sản phẩm không tồn tại hoặc đã bị khóa.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, user]); // ✅ Đã bỏ viewIncremented ra khỏi dependency

  const handleAddToCart = async () => {
    if (!product) return;

    const status = (product.status || "").toLowerCase().trim();
    const isComingSoon =
      status.includes("coming_soon") ||
      status.includes("comingsoon") ||
      status.includes("sắp") ||
      status.includes("sap");

    const preorder = isComingSoon || product.stock <= 0;

    await addToCart(
      product.id,
      quantity,
      { ...product, preorder },
      () => setQuantity(1),
      () => { }
    );
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.info("Bạn cần đăng nhập để đánh giá", { position: "bottom-right" });
      return;
    }
    if (newComment.trim() === "") {
      notification.warning({
        message: "Cảnh báo",
        description: "Vui lòng nhập nội dung đánh giá.",
        placement: "topRight",
      });
      return;
    }

    try {
      await reviewApi.addReview(id, { rating: newRating, comment: newComment });
      const updatedProduct = await productApi.getProduct(id);
      const updatedReviews = await reviewApi.getReviews(id);
      setProduct(updatedProduct);
      setReviews(updatedReviews);
      setNewComment("");
      setNewRating(5);
      toast.success("Đã gửi đánh giá!", { position: "bottom-right" });
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.non_field_errors) {
        toast.warning(errorData.non_field_errors[0], {
          position: "bottom-right",
        });
      } else {
        toast.error("Không thể gửi đánh giá", { position: "bottom-right" });
      }
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    const status = (product.status || "").toLowerCase().trim();
    const isComingSoon =
      status.includes("coming_soon") ||
      status.includes("comingsoon") ||
      status.includes("sắp") ||
      status.includes("sap");
    const isOutOfStock = product.stock <= 0;

    if (isComingSoon || isOutOfStock) {
      setPreorderQty(quantity || 1);
      setShowPreorderModal(true);
      return;
    }

    setAdding(true);
    await addToCart(
      product.id,
      quantity,
      {
        id: product.id,
        name: product.name,
        price: Number(product.discounted_price ?? product.price) || 0,
        image:
          product.image && product.image.startsWith("/")
            ? `http://localhost:8000${product.image}`
            : product.image?.startsWith("http")
              ? product.image
              : "",
        preorder: false,
      },
      () => {
        setAdding(false);
        navigate("/cart");
      },
      () => {
        message.error("Không thể thêm vào giỏ hàng");
        setAdding(false);
      }
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  // ✅ Hiển thị thông báo lỗi nếu không có quyền truy cập
  if (error || !product) {
    return (
      <div className="product-detail-container">
        <Alert
          message="Không thể truy cập"
          description={error || "Sản phẩm không tồn tại hoặc đã bị khóa."}
          type="warning"
          showIcon
          action={
            <Button onClick={() => navigate(-1)} type="primary">
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  const breadcrumbItems = [
    { title: "Trang chủ", href: "/" },
    {
      title: categoryName,
      href: `/products?category=${encodeURIComponent(categoryName)}`,
    },
    {
      title: subcategoryName,
      href: `/products?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`,
    },
    { title: product.name },
  ];

  return (
    <div className="product-detail-container">
      <div className="product-detail-breadcrumb-wrap">
        <Breadcrumb
          className="product-detail-breadcrumb"
          items={breadcrumbItems.map((item, index) => ({
            title: item.href ? (
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className="product-detail-breadcrumb-link"
              >
                {item.title}
              </a>
            ) : (
              <span className={index === breadcrumbItems.length - 1 ? "product-detail-breadcrumb-title" : ""}>
                {item.title}
              </span>
            ),
          }))}
        />
      </div>

      <Card style={{ borderRadius: 8 }}>
        <div className="product-layout">
          <div className="product-image-section">
            <ProductImage
              product={product}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>

          <div className="product-info-section">
            <ProductInfo
              product={product}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              adding={adding}
              user={user}
              status={product.status}
            />
          </div>
          {(product.status === "coming_soon" ||
            product.status === "sắp có") && (
              <div
                style={{
                  marginTop: 12,
                  color: "#444",
                  fontSize: 15,
                  background: "#fffbe6",
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: "1px solid #ffe58f",
                }}
              >
                <p style={{ marginBottom: 6 }}>
                  <strong>Đã đặt trước:</strong>{" "}
                  <b style={{ color: "#1890ff" }}>
                    {product.ordered_quantity || 0}
                  </b>{" "}
                  sản phẩm
                </p>

                <p style={{ marginBottom: 8 }}>
                  <strong>Cần đặt:</strong>{" "}
                  <b style={{ color: "#faad14" }}>
                    {Math.max(
                      (product.expected_quantity ||
                        product.estimated_quantity ||
                        0) - (product.ordered_quantity || 0),
                      0
                    ).toLocaleString("vi-VN")}
                  </b>{" "}
                  sản phẩm
                </p>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    style={{ width: 100 }}
                  />
                  <Button
                    type="primary"
                    onClick={async () => {
                      try {
                        const maxQty =
                          product.expected_quantity ||
                          product.estimated_quantity ||
                          product.stock ||
                          0;

                        const ordered = product.ordered_quantity || 0;
                        const remaining = Math.max(maxQty - ordered, 0);

                        if (remaining <= 0) {
                          toast.warning("⚠️ Sản phẩm đã hết lượt đặt trước!", {
                            position: "bottom-right",
                          });
                          return;
                        }

                        if (quantity > remaining) {
                          toast.error(
                            `Bạn chỉ có thể đặt trước tối đa ${remaining} sản phẩm nữa!`,
                            { position: "bottom-right" }
                          );
                          return;
                        }

                        if (user) {
                          await productApi.preorderProduct(product.id, quantity);
                          toast.success(
                            `✅ Đặt trước ${quantity} sản phẩm thành công!`,
                            {
                              position: "bottom-right",
                            }
                          );

                          setProduct((prev) => ({
                            ...prev,
                            ordered_quantity:
                              (prev.ordered_quantity || 0) + Number(quantity),
                          }));
                          setQuantity(1);
                          navigate("/preorders");
                        } else {
                          const stored = JSON.parse(
                            localStorage.getItem("preorders") || "[]"
                          );
                          const exists = stored.find(
                            (p) => String(p.id) === String(product.id)
                          );

                          if (exists) {
                            const newQty = (exists.quantity || 0) + quantity;
                            if (newQty > remaining) {
                              toast.error(
                                `Bạn chỉ có thể đặt thêm tối đa ${remaining - (exists.quantity || 0)
                                } sản phẩm nữa!`,
                                { position: "bottom-right" }
                              );
                              return;
                            }
                            exists.quantity = newQty;
                            exists.date = new Date().toISOString();
                          } else {
                            stored.push({
                              id: product.id,
                              name: product.name,
                              image:
                                product.image && product.image.startsWith("/")
                                  ? `http://localhost:8000${product.image}`
                                  : product.image,
                              price:
                                Number(
                                  product.discounted_price ?? product.price
                                ) || 0,
                              quantity: quantity,
                              date: new Date().toISOString(),
                            });
                          }

                          localStorage.setItem(
                            "preorders",
                            JSON.stringify(stored)
                          );
                          toast.success(
                            `✅ Đã lưu ${quantity} sản phẩm vào danh sách đặt trước!`,
                            {
                              position: "bottom-right",
                            }
                          );
                          setQuantity(1);
                          navigate("/preorders");
                        }
                      } catch (err) {
                        toast.error("Không thể đặt trước sản phẩm này!", {
                          position: "bottom-right",
                        });
                      }
                    }}
                  >
                    Đặt trước
                  </Button>
                </div>
              </div>
            )}
        </div>
      </Card>

      {product.store && (
        <StoreCard store={product.store} productId={product.id} />
      )}

      <Card style={{ marginTop: 24, borderRadius: 8 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          Mô tả sản phẩm
        </Title>
        <Paragraph
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: "#444",
            minHeight: 40,
          }}
        >
          {product.description || (
            <Text type="secondary">Chưa có mô tả cho sản phẩm này.</Text>
          )}
        </Paragraph>
        <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
          <div>
            <Text strong>Đơn vị:</Text>
            <Text style={{ marginLeft: 8 }}>
              {product.unit || <Text type="secondary">Không xác định</Text>}
            </Text>
          </div>

          <div>
            <Text strong>Thương hiệu:</Text>
            <Text style={{ marginLeft: 8 }}>
              {product.brand || <Text type="secondary">Không có</Text>}
            </Text>
          </div>

          <div>
            <Text strong>Vị trí:</Text>
            <Text style={{ marginLeft: 8 }}>
              {product.location || <Text type="secondary">Không có</Text>}
            </Text>
          </div>
        </div>
      </Card>

      <ReviewsSection
        user={user}
        reviews={reviews}
        myReview={myReview}
        newComment={newComment}
        newRating={newRating}
        hasReviewed={hasReviewed}
        onNewCommentChange={setNewComment}
        onNewRatingChange={setNewRating}
        onSubmitReview={handleSubmitReview}
      />


      <RelatedProducts products={relatedProducts} />
    </div>
  );
};

export default ProductDetailPage;