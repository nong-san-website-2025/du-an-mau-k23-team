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
    // 👈 không cần (e, product) vì product đã có trong scope
    if (!product || quantity > product.stock) {
      toast.warning("Số lượng vượt quá hàng trong kho.", {
        position: "bottom-right",
      });
      return;
    }

    // Helper: lấy product ID từ cart item
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
      await updateQuantity(product.id, existingItem.quantity + quantity); // 👈 cộng thêm quantity hiện tại
      message.success("Đã cập nhật số lượng trong giỏ hàng!");
      return;
    }

    setAdding(true);
    await addToCart(
      product.id,
      quantity, // 👈 dùng quantity thay vì 1
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
      },
      () => {
        message.success("Đã thêm sản phẩm vào giỏ hàng!");
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
  const handleBuyNow = async () => {
    if (!product || quantity < 1 || quantity > product.stock) {
      toast.warning("Số lượng không hợp lệ.", { position: "bottom-right" });
      return;
    }
    await addToCart(
      product.id,
      quantity,
      {
        id: product.id,
        name: product.name,
        image:
          product.image && product.image.startsWith("/")
            ? `http://localhost:8000${product.image}`
            : product.image,
        price: Number(product.discounted_price ?? product.price) || 0,
      },
      () => {},
      () => {}
    );
    selectOnlyByProductId(product.id);
    navigate("/checkout");
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
      <div className="product-detail-error-container">
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
    <div className="product-detail-page-container">
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
            />
          </div>
        </Space>
      </Card>

      {/* Mô tả */}
      <Card style={{ marginTop: 24, borderRadius: 8 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          📝 Mô tả sản phẩm
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
