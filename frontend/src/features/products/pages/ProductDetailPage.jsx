import React, { useEffect, useState } from "react";
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
  Modal,
  InputNumber,
} from "antd";
import ProductImage from "../components/ProductImage";
import ProductInfo from "../components/ProductInfo";
import ReviewsSection from "../components/ReviewsSection";
import RelatedProducts from "../components/RelatedProducts";
import StoreCard from "../components/StoreCard";
import { productApi } from "../services/productApi";
import { reviewApi } from "../services/reviewApi";
import { useAuth } from "../../login_register/services/AuthContext";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, cartItems, selectOnlyByProductId } =
    useCart();
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

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myReview, setMyReview] = useState(null);

  // Hàm tạo mảng breadcrumb từ category lồng nhau

  // Kiểm tra trạng thái yêu thích từ localStorage
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const fav = list.some((item) => String(item.id) === String(id));
      setIsFavorite(fav);
    } catch {
      setIsFavorite(false);
    }
  }, [id]);

  // Thêm trong useEffect load dữ liệu
  useEffect(() => {
    const loadCategories = async () => {
      if (!product) return;

      try {
        // Gọi API danh mục
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

  // Load sản phẩm liên quan
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

  // Xử lý yêu thích
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

  // Load dữ liệu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await productApi.getProduct(id);
        setProduct(productData);

        const reviewList = await reviewApi.getReviews(id);
        setReviews(reviewList);

        if (user) {
          const myReview = await reviewApi.getMyReview(id).catch(() => null);
          setMyReview(myReview);
          setHasReviewed(!!myReview);
        }
      } catch (err) {
        setError("Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!product) return;

    const status = (product.status || "").toLowerCase().trim();
    const isComingSoon =
      status.includes("coming_soon") ||
      status.includes("comingsoon") ||
      status.includes("sắp") ||
      status.includes("sap");

    // Nếu là sản phẩm sắp có → cho phép đặt trước
    if (isComingSoon) {
      toast.info("Sản phẩm sắp có, bạn có thể đặt trước.", {
        position: "bottom-right",
      });
      return;
    }

    // Nếu hết hàng mà không phải sắp có → cho phép đặt trước (preorder)
    const isOutOfStock = product.stock <= 0;
    const preorder = isOutOfStock;

    // Nếu đến đây thì có thể thêm vào giỏ
    const getProductId = (item) => {
      return (
        item.product_data?.id ||
        (item.product?.id !== undefined ? item.product.id : item.product)
      );
    };

    const existingItem = cartItems.find(
      (item) => String(getProductId(item)) === String(product.id)
    );

    if (existingItem) {
      await updateQuantity(product.id, existingItem.quantity + quantity);
      message.success("Đã cập nhật số lượng trong giỏ hàng!");
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
        // Thêm flag preorder để CartContext/Backend biết đây là đặt trước
        preorder,
      },
      () => {
        if (preorder)
          message.success("Đã thêm sản phẩm vào giỏ hàng (Đặt trước)!");
        else message.success("Đã thêm sản phẩm vào giỏ hàng!");
        setAdding(false);
      },
      () => {
        message.error("Không thể thêm vào giỏ hàng");
        setAdding(false);
      }
    );
  };

  // Gửi đánh giá
  const handleSubmitReview = async () => {
    if (!user) {
      toast.info("Bạn cần đăng nhập để đánh giá", { position: "bottom-right" });
      return;
    }
    if (newComment.trim() === "") {
      toast.warning("Vui lòng nhập bình luận", { position: "bottom-right" });
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

  // Mua ngay
  // Mua ngay / Đặt trước
  const handleBuyNow = async () => {
    if (!product) return;

    const status = (product.status || "").toLowerCase().trim();
    const isComingSoon =
      status.includes("coming_soon") ||
      status.includes("comingsoon") ||
      status.includes("sắp") ||
      status.includes("sap");
    const isOutOfStock = product.stock <= 0;

    // ✅ Nếu là sắp có hoặc hết hàng → xử lý "Đặt trước"
    if (isComingSoon || isOutOfStock) {
      // Hiện modal để người dùng nhập số lượng đặt trước ngay trên trang sản phẩm
      setPreorderQty(quantity || 1);
      setShowPreorderModal(true);
      return;
    }

    // ✅ Nếu còn hàng → xử lý mua bình thường
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
        message.success("Đã thêm sản phẩm vào giỏ hàng!");
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

  if (error || !product) {
    return (
      <div style={{ maxWidth: 600, margin: "10px 190px" }}>
        <Alert
          message="Lỗi"
          description={error}
          type="error"
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
      href: `/products?subcategory=${encodeURIComponent(subcategoryName)}`,
    },
    { title: product.name },
  ];
  return (
    <div style={{ padding: "24px 160px" }}>
      <Modal
        title={`Đặt trước: ${product?.name || "sản phẩm"}`}
        open={showPreorderModal}
        onCancel={() => setShowPreorderModal(false)}
        okText="Xác nhận đặt"
        onOk={async () => {
          const qty = Number(preorderQty) || 1;
          try {
            if (user) {
              await productApi.preorderProduct(product.id, qty);
              toast.success(`✅ Đã đặt trước ${qty} sản phẩm!`, {
                position: "bottom-right",
              });
              // Cập nhật state sản phẩm nếu backend trả về số liệu (tốt nhất là fetch lại)
              const updated = await productApi.getProduct(product.id);
              setProduct(updated);
            } else {
              const stored = JSON.parse(
                localStorage.getItem("preorders") || "[]"
              );
              const exists = stored.find(
                (p) => String(p.id) === String(product.id)
              );
              if (exists) {
                exists.quantity = (exists.quantity || 0) + qty;
                exists.date = new Date().toISOString();
              } else {
                stored.push({
                  id: product.id,
                  name: product.name,
                  image:
                    product.image && product.image.startsWith("/")
                      ? `http://localhost:8000${product.image}`
                      : product.image,
                  price: Number(product.discounted_price ?? product.price) || 0,
                  quantity: qty,
                  date: new Date().toISOString(),
                });
              }
              localStorage.setItem("preorders", JSON.stringify(stored));
              toast.success(
                `✅ Đã lưu ${qty} sản phẩm vào danh sách đặt trước (guest)!`,
                {
                  position: "bottom-right",
                }
              );
            }

            setShowPreorderModal(false);
            navigate("/preorders");
          } catch (err) {
            console.error(err);
            toast.error("Không thể đặt trước sản phẩm này!", {
              position: "bottom-right",
            });
          }
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Text> Số lượng: </Text>
          <InputNumber
            min={1}
            value={preorderQty}
            onChange={(v) => setPreorderQty(v)}
          />
        </div>
      </Modal>
      <Breadcrumb
        items={breadcrumbItems.map((item) => ({
          title: item.href ? (
            <a
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              style={{ color: "#1890ff" }}
            >
              {item.title}
            </a>
          ) : (
            item.title
          ),
        }))}
        style={{ marginBottom: 16 }}
      />
      <Card style={{ borderRadius: 8 }}>
        <Space size={24} style={{ width: "100%" }}>
          <div style={{ flex: 1 }}>
            <ProductImage
              product={product}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>

          <div style={{ flex: 1 }}>
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
                      await productApi.preorderProduct(product.id, quantity);
                      toast.success(
                        `✅ Đặt trước ${quantity} sản phẩm thành công!`,
                        {
                          position: "bottom-right",
                        }
                      );
                      // Cập nhật lại số lượng đã đặt
                      setProduct((prev) => ({
                        ...prev,
                        ordered_quantity:
                          (prev.ordered_quantity || 0) + Number(quantity),
                      }));
                      setQuantity(1);
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
        </Space>
      </Card>

      {/* Mô tả */}
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

      {/* Cửa hàng */}
      {product.store && (
        <StoreCard store={product.store} productId={product.id} />
      )}

      {/* Đánh giá */}
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

      {/* Sản phẩm liên quan */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
};

export default ProductDetailPage;
