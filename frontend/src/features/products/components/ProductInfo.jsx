import React, { useState, useEffect } from "react";
import {
  Button,
  Space,
  Typography,
  Rate,
  Tag,
  InputNumber,
  message,
  Divider,
} from "antd";
import {
  ShoppingCartOutlined,
  MinusOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  InfoCircleOutlined,
  FireOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import CSS tùy chỉnh ở trên
import "../styles/ProductDetail.css"; 
// Hàm format tiền
import { formatVND } from "../../stores/components/StoreDetail/utils/utils";

const { Title, Text } = Typography;

const ProductInfo = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  adding,
}) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Lấy API URL từ env và nối thêm endpoint
  const API_URL = `${process.env.REACT_APP_API_URL}/orders/preorders/`;

  const [backendPreorderQty, setBackendPreorderQty] = useState(0);
  const [loading, setLoading] = useState(false);
  const [flashSaleInfo, setFlashSaleInfo] = useState(null);

  // --- Logic API giữ nguyên ---
  const fetchBackendPreorderQty = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sameProduct = res.data.filter(
        (item) => String(item.product) === String(product.id)
      );
      const total = sameProduct.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      setBackendPreorderQty(total);
    } catch (err) {
      console.error("Lỗi lấy pre-order:", err);
    }
  };

  useEffect(() => {
    if (token && product?.id) fetchBackendPreorderQty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, token]);

  // --- Logic Fetch Flash Sale Data ---
  const fetchFlashSaleData = async () => {
    if (!product?.id) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/promotions/flash-sales/`);
      const flashSales = Array.isArray(response.data) ? response.data : (response.data.results || []);
      
      if (flashSales && flashSales.length > 0) {
        const activeFlashSale = flashSales[0];
        const productInFlashSale = activeFlashSale.flashsale_products?.find(
          p => {
            const productId = p.product_id || p.product;
            return String(productId) === String(product.id);
          }
        );
        
        if (productInFlashSale) {
          setFlashSaleInfo({
            flashSaleId: activeFlashSale.id,
            flashPrice: productInFlashSale.flash_price,
            originalPrice: productInFlashSale.original_price,
            discountPercent: Math.round(((productInFlashSale.original_price - productInFlashSale.flash_price) / productInFlashSale.original_price) * 100)
          });
        } else {
          setFlashSaleInfo(null);
        }
      } else {
        setFlashSaleInfo(null);
      }
    } catch (err) {
      console.error("Lỗi fetch flash sale:", err);
      setFlashSaleInfo(null);
    }
  };

  useEffect(() => {
    if (product?.id) fetchFlashSaleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // --- Logic Trạng thái ---
  const rawStatus = (product.availability_status || "").toLowerCase().trim();
  const stock = Number(product.stock) || 0;
  const isComingSoon = ["coming_soon", "comingsoon", "sắp"].some(s => rawStatus.includes(s));
  const isOutOfStock = !isComingSoon && stock <= 0;

  const availableFrom = product.season_start || product.available_from;
  const estimatedQuantity = product.estimated_quantity || 0;
  const totalPreordered = backendPreorderQty;

  // --- [LOGIC GIÁ BÁN CHUẨN] ---
  const rawDiscount = parseFloat(product.discounted_price);
  const rawOriginal = parseFloat(product.original_price);
  const rawPrice = parseFloat(product.price);

  // Quyết định giá bán cuối cùng (finalPrice)
  let finalPrice = 0;
  let originalPriceDisplay = 0;
  let hasDiscount = false;
  let isFlashSale = false;
  let discountPercent = 0;

  // Kiểm tra Flash Sale trước
  if (flashSaleInfo) {
      finalPrice = flashSaleInfo.flashPrice;
      originalPriceDisplay = flashSaleInfo.originalPrice;
      hasDiscount = true;
      isFlashSale = true;
      discountPercent = flashSaleInfo.discountPercent;
  } else if (!isNaN(rawDiscount) && rawDiscount > 0) {
      // Có giá giảm -> Giá bán là giá giảm
      finalPrice = rawDiscount;
      hasDiscount = true;
      // Giá gốc để gạch ngang (ưu tiên original_price, nếu k có thì lấy price)
      originalPriceDisplay = !isNaN(rawOriginal) && rawOriginal > 0 ? rawOriginal : rawPrice;
  } else {
      // Không có giá giảm -> Giá bán là giá gốc hoặc giá thường
      if (!isNaN(rawOriginal) && rawOriginal > 0) {
          finalPrice = rawOriginal;
      } else {
          finalPrice = rawPrice;
      }
  }

  // --- Hàm xử lý Đặt trước ---
  const handlePreorder = async () => {
    const qty = Number(quantity) || 1;
    if (qty + totalPreordered > estimatedQuantity) {
      message.warning("⚠️ Vượt quá số lượng ước tính có thể cung cấp!");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        API_URL,
        { product: product.id, quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Đặt trước thành công! Chúng tôi sẽ liên hệ khi có hàng.");
      fetchBackendPreorderQty();
      navigate("/preorders");
    } catch (err) {
       if (err.response?.status === 401) message.error("Vui lòng đăng nhập!");
       else message.error("Lỗi đặt trước!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingRight: 24 }}>
      {/* 1. Tiêu đề & Đánh giá */}
      <Title level={3} style={{ marginBottom: 8, fontWeight: 500 }}>
        {product.is_coming_soon && <Tag color="orange">ĐẶT TRƯỚC</Tag>}
        {product.name}
      </Title>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <Space size={4}>
          <Text strong style={{ color: "#faad14", borderBottom: "1px solid #faad14" }}>
            {Number(product.rating || 0).toFixed(1)}
          </Text>
          <Rate disabled allowHalf value={Number(product.rating || 0)} style={{ fontSize: 14, color: "#faad14" }} />
        </Space>
        <Divider type="vertical" style={{ height: 20, borderColor: "#e0e0e0" }} />
        <Text type="secondary">{product.review_count || 0} Đánh giá</Text>
        <Divider type="vertical" style={{ height: 20, borderColor: "#e0e0e0" }} />
        <Text type="secondary">{product.sold || 0} Đã bán</Text>
      </div>

      {/* 2. Khu vực Giá (Đã sửa logic hiển thị) */}
      <div className="price-section">
        <Space align="baseline" size={12}>
          {/* Chỉ hiển thị giá gạch ngang nếu ĐANG CÓ GIẢM GIÁ và giá gốc lớn hơn giá bán */}
          {hasDiscount && originalPriceDisplay > finalPrice && (
            <Text delete type="secondary" style={{ fontSize: 16 }}>
              {formatVND(originalPriceDisplay)}
            </Text>
          )}
          
          <Text style={{ fontSize: 32, fontWeight: 600, color: "#cf1322" }}>
            {finalPrice > 0 ? formatVND(finalPrice) : "Liên hệ"}
          </Text>

          {isFlashSale ? (
            <Tag color="red" icon={<FireOutlined />} style={{ fontWeight: 600 }}>
              FLASH SALE -{discountPercent}%
            </Tag>
          ) : hasDiscount && product.discount_percent > 0 && (
            <Tag color="red" style={{ fontWeight: 600 }}>
              GIẢM {product.discount_percent}%
            </Tag>
          )}
        </Space>
        
        {/* Cam kết giá tốt */}
        <div style={{ marginTop: 8 }}>
            <Tag color="geekblue" icon={<SafetyCertificateOutlined />}>Cam kết chính hãng</Tag>
            <Tag color="green" icon={<GiftOutlined />}>Tích điểm GreenPoint</Tag>
            {isFlashSale && <Tag color="orange" icon={<FireOutlined />}>Đang có Flash Sale</Tag>}
        </div>
      </div>

      {/* Flash Sale Info */}
      {isFlashSale && flashSaleInfo && (
        <div style={{ background: "#fff1f0", border: "2px solid #ff4d4f", padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <Space align="start" style={{ width: "100%" }} direction="vertical" size={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FireOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
              <Text strong style={{ color: "#ff4d4f", fontSize: 16 }}>FLASH SALE ĐANG DIỄN RA</Text>
            </div>
            <div style={{ fontSize: 13, color: "#666", paddingLeft: 26 }}>
              <div style={{ marginBottom: 8 }}>
                <Text>Giá gốc: <Text delete type="secondary" strong>{formatVND(flashSaleInfo.originalPrice)}</Text></Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text>Giá Flash Sale: <Text strong style={{ fontSize: 16, color: "#ff4d4f" }}>{formatVND(flashSaleInfo.flashPrice)}</Text></Text>
              </div>
              <div>
                <Text>Tiết kiệm: <Text strong style={{ color: "#52c41a" }}>{formatVND(flashSaleInfo.originalPrice - flashSaleInfo.flashPrice)} ({flashSaleInfo.discountPercent}%)</Text></Text>
              </div>
            </div>
          </Space>
        </div>
      )}

      {/* 3. Các thông tin chi tiết */}
      <div style={{ marginBottom: 24 }}>
        {/* Đơn vị tính */}
        <div className="meta-row">
            <span className="meta-label">Đơn vị bán</span>
            <Text>{product.unit || "Sản phẩm"}</Text>
        </div>

        {/* Tình trạng hàng Sắp có */}
        {isComingSoon && (
          <div style={{ background: "#fff7e6", border: "1px dashed #ffa940", padding: 12, borderRadius: 4, marginBottom: 16 }}>
            <Space align="start">
              <ClockCircleOutlined style={{ color: "#fa8c16", marginTop: 4 }} />
              <div>
                <Text strong style={{ color: "#fa8c16" }}>Sản phẩm đặt trước (Pre-order)</Text>
                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                   Thời gian thu hoạch: <strong>{new Date(availableFrom).toLocaleDateString("vi-VN")}</strong>
                   <br/>
                   Còn lại: {Math.max(0, estimatedQuantity - totalPreordered)} suất đặt trước
                </div>
              </div>
            </Space>
          </div>
        )}

        {/* Chọn số lượng */}
        <div className="meta-row" style={{ marginTop: 20 }}>
          <span className="meta-label" style={{ paddingTop: 6 }}>Số lượng</span>
          <div className="quantity-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
                icon={<MinusOutlined />} 
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
            />
            <InputNumber
                min={1}
                max={isComingSoon ? (estimatedQuantity - totalPreordered) : product.stock}
                value={quantity}
                onChange={(v) => onQuantityChange(v || 1)}
                controls={false}
            />
            <Button 
                icon={<PlusOutlined />} 
                onClick={() => onQuantityChange(quantity + 1)}
                disabled={quantity >= (isComingSoon ? (estimatedQuantity - totalPreordered) : product.stock)}
            />
            <Text type="secondary" style={{ marginLeft: 16, fontSize: 13 }}>
                {isComingSoon 
                   ? `Giới hạn ${estimatedQuantity - totalPreordered} sp` 
                   : `${stock} sản phẩm có sẵn`}
            </Text>
          </div>
        </div>
      </div>

      {/* 4. Nút hành động */}
      <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
        {isComingSoon ? (
            <Button
                type="primary"
                size="large"
                danger
                loading={loading}
                onClick={handlePreorder}
                style={{ height: 48, width: 200, fontWeight: 600, background: '#fa8c16', borderColor: '#fa8c16' }}
                icon={<ClockCircleOutlined />}
            >
                ĐẶT TRƯỚC NGAY
            </Button>
        ) : isOutOfStock ? (
             <Button type="primary" size="large" disabled style={{ height: 48, width: 200 }}>
                HẾT HÀNG
             </Button>
        ) : (
            <>
                <Button
                    className="btn-add-cart"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    loading={adding}
                    onClick={onAddToCart}
                    style={{ flex: 1, maxWidth: 220 }}
                >
                    Thêm vào giỏ
                </Button>
                <Button
                    className="btn-buy-now"
                    type="primary"
                    size="large"
                    onClick={onBuyNow}
                    style={{ flex: 1, maxWidth: 220 }}
                >
                    Mua ngay
                </Button>
            </>
        )}
      </div>

      {/* 5. Footer chính sách */}
      <Divider style={{ margin: "24px 0" }} />
      <div style={{ display: 'flex', gap: 24, color: '#595959', fontSize: 13 }}>
          <Space><SafetyCertificateOutlined style={{ color: '#52c41a' }} /> 100% Nguồn gốc rõ ràng</Space>
          <Space><InfoCircleOutlined style={{ color: '#52c41a' }} /> Được kiểm tra hàng</Space>
      </div>
    </div>
  );
};

export default ProductInfo;