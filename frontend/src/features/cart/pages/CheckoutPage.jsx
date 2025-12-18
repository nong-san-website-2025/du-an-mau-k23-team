// src/features/checkout/pages/CheckoutPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import {
  Row,
  Col,
  Typography,
  Divider,
  Button,
  Input,
  Modal,
  message,
  Card,
  Avatar,
  Space,
  Image
} from "antd";
import {
  TagOutlined,
  FileTextOutlined,
  ShopOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  ShoppingOutlined
} from "@ant-design/icons";

// Styles
import "../styles/CheckoutPage.css";

// API & Services
import API from "../../login_register/services/api";
import { getSellerDetail } from "../../sellers/services/sellerService";

// Components
import useCheckoutLogic from "../hooks/useCheckoutLogic";
import AddressSelector from "../components/AddressSelector";
import VoucherSection from "../components/VoucherSection";
import PaymentMethod from "../components/PaymentMethod";
import PaymentButton from "../components/PaymentButton";
import AddressAddForm from "../../users/components/Address/AddressAddForm";
import { intcomma } from "../../../utils/format";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  // Lọc sản phẩm được chọn
  const checkoutItems = cartItems.filter((item) => item.selected);

  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [sellerInfos, setSellerInfos] = useState({});

  const {
    shippingFee,
    selectedAddressId,
    manualEntry,
    discount,
    payment,
    isLoading,
    addresses,
    total,
    totalAfterDiscount,
    selectedItems,
    selectedAddress,
    customerName,
    customerPhone,
    addressText,
    note,
    setSelectedAddressId,
    setManualEntry,
    setPayment,
    setNote,
    handleApplyVoucher,
    handleOrder,
    fetchAddresses,
    addAddress,
  } = useCheckoutLogic();

  const isAddressValid =
    (selectedAddressId && selectedAddress?.location) ||
    (manualEntry && customerName && customerPhone && addressText);
  const isReadyToOrder =
    selectedItems.length > 0 && isAddressValid && shippingFee > 0;

  // 1. LOGIC LOAD SELLER INFO
  useEffect(() => {
    const loadSellerInfos = async () => {
      const storeIds = new Set();
      checkoutItems.forEach((item) => {
        const storeId =
          item.product_data?.store?.id || item.product?.store?.id;
        if (storeId) storeIds.add(storeId);
      });

      const newSellerInfos = { ...sellerInfos };
      for (const storeId of storeIds) {
        if (!sellerInfos[storeId]) {
          try {
            const sellerData = await getSellerDetail(storeId);
            newSellerInfos[storeId] = sellerData;
          } catch (err) {
            console.warn(`❌ Lỗi tải thông tin seller ${storeId}:`, err);
            newSellerInfos[storeId] = { store_name: "Cửa hàng", image: null };
          }
        }
      }
      setSellerInfos(newSellerInfos);
    };

    if (checkoutItems.length > 0) {
      loadSellerInfos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // 2. GROUP ITEMS BY STORE
  const groupedItems = checkoutItems.reduce((acc, item) => {
    const storeId =
      item.product_data?.store?.id || item.product?.store?.id || "store-less";
    if (!acc[storeId]) {
      acc[storeId] = { items: [] };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  // 3. LOGIC ADDRESS
  // 3. LOGIC ADDRESS - ĐÃ SỬA LẠI
  const handleAddressAddedSuccess = async (newAddressData) => {
    try {
      setIsSavingAddress(true);

      // SỬA: Dùng hàm addAddress từ hook thay vì gọi API thủ công
      // Hàm này trong hook đã bao gồm việc gọi API và cập nhật state list địa chỉ rồi
      const createdAddress = await addAddress(newAddressData);

      // Nếu tạo thành công (hàm addAddress trả về data)
      if (createdAddress && createdAddress.id) {
        setSelectedAddressId(createdAddress.id); // Tự động chọn địa chỉ mới tạo
      }

      // Đóng modal
      setIsAddAddressModalOpen(false);

    } catch (error) {
      // Lỗi chi tiết đã được xử lý hoặc log trong hook
      console.error("Lỗi khi thêm địa chỉ:", error);
    } finally {
      // Tắt loading (quan trọng để nút không quay mãi)
      setIsSavingAddress(false);
    }
  };

  const renderCheckoutAction = () => {
    if (payment === "Ví điện tử") {
      return (
        <PaymentButton
          amount={totalAfterDiscount}
          orderData={{}}
          disabled={!isReadyToOrder || isLoading}
        />
      );
    }
    return (
      <Button
        type="primary"
        size="large"
        block
        loading={isLoading}
        onClick={handleOrder}
        disabled={!isReadyToOrder}
        style={{
          height: 48,
          fontSize: 16,
          fontWeight: 700,
          background: "#2e7d32",
          border: "none",
          textTransform: "uppercase",
        }}
        className="btn-checkout"
      >
        Đặt hàng
      </Button>
    );
  };

  // --- SUB-COMPONENT: RENDER IMAGE WITH FALLBACK ---
  const ProductImage = ({ src, alt }) => {
    if (!src) {
      return (
        <div
          style={{
            width: 80,
            height: 80,
            background: "#f5f5f5",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #eee",
          }}
        >
          <PictureOutlined style={{ fontSize: 24, color: "#bfbfbf" }} />
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width: 80,
          height: 80,
          objectFit: "cover",
          borderRadius: 6,
          border: "1px solid #f0f0f0",
        }}
      />
    );
  };

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        <div className="checkout-title">Thanh toán</div>

        <Row gutter={24}>
          {/* === CỘT TRÁI === */}
          <Col xs={24} lg={16}>
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
              manualEntry={manualEntry}
              onToggleManual={() => setManualEntry(!manualEntry)}
              onAddNew={() => setIsAddAddressModalOpen(true)}
            />

            {/* ✅ KHU VỰC HIỂN THỊ DANH SÁCH SẢN PHẨM (ĐÃ REFACTOR) */}
            <div className="checkout-product-groups" style={{ marginBottom: 20 }}>
              {Object.entries(groupedItems).map(([storeId, { items }]) => {
                const sellerInfo = sellerInfos[storeId] || {};
                const storeName = sellerInfo.store_name || "Cửa hàng";
                const storeImage = sellerInfo.image;

                return (
                  <Card
                    key={storeId}
                    className="checkout-card"
                    bodyStyle={{ padding: "0" }} // Reset padding để custom bên trong
                    style={{ marginBottom: 16, overflow: "hidden" }}
                  >
                    {/* Header Shop - Thiết kế tách biệt */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        background: "#fafafa",
                      }}
                    >
                      <Space>
                        <Avatar
                          src={storeImage}
                          icon={<ShopOutlined />}
                          size="small"
                          style={{ backgroundColor: "#87d068" }}
                        />
                        <Text strong style={{ fontSize: 15 }}>
                          {storeName}
                        </Text>
                        <Divider type="vertical" />
                        <Button
                          type="link"
                          size="small"
                          icon={<ShopOutlined />}
                          style={{ padding: 0 }}
                        >
                          Xem Shop
                        </Button>
                      </Space>
                    </div>

                    {/* List Items - Sử dụng Grid System */}
                    <div style={{ padding: "16px" }}>
                      {items.map((item, index) => {
                        const prod = item.product_data || item.product || {};
                        const price = Number(prod.price) || 0;
                        const qty = Number(item.quantity) || 1;
                        const subtotal = price * qty;

                        return (
                          <div key={item.id || prod.id}>
                            <Row
                              gutter={[16, 16]}
                              align="middle"
                              style={{ flexWrap: "nowrap" }} // Ngăn vỡ layout trên mobile nhỏ
                            >
                              {/* Cột 1: Ảnh sản phẩm */}
                              <Col flex="80px">
                                <ProductImage src={prod.image} alt={prod.name} />
                              </Col>

                              {/* Cột 2: Thông tin chi tiết */}
                              <Col flex="auto">
                                <div style={{ display: 'flex', flexDirection: 'column', height: '80px', justifyContent: 'space-between' }}>
                                  <div>
                                    <Text
                                      ellipsis={{ tooltip: prod.name }}
                                      style={{
                                        fontSize: 15,
                                        fontWeight: 500,
                                        marginBottom: 4,
                                        maxWidth: "100%",
                                        display: "block",
                                      }}
                                    >
                                      {prod.name}
                                    </Text>

                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 13 }}>
                                      Đơn giá: {intcomma(price)}₫
                                    </Text>
                                    <Text type="secondary">x{qty}</Text>
                                  </div>
                                </div>
                              </Col>

                              {/* Cột 3: Thành tiền (Căn phải) - Ẩn trên mobile quá nhỏ nếu cần */}
                              <Col
                                flex="100px"
                                style={{ textAlign: "right", alignSelf: "flex-end", paddingBottom: 4 }}
                              >
                                <Text strong style={{ color: "#fa541c", fontSize: 16 }}>
                                  {intcomma(subtotal)}₫
                                </Text>
                              </Col>
                            </Row>

                            {/* Divider giữa các sản phẩm (trừ sản phẩm cuối) */}
                            {index < items.length - 1 && (
                              <Divider style={{ margin: "16px 0" }} dashed />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Shop - Nơi đặt shipping method riêng cho shop (Future proof) */}
                    <div
                      style={{
                        padding: "12px 16px",
                        borderTop: "1px dashed #f0f0f0",
                        background: "#fff",
                      }}
                    >
                      <Row align="middle" justify="space-between">
                        <Col>
                          <Space size={4}>
                            <EnvironmentOutlined style={{ color: '#1890ff' }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>Đơn vị vận chuyển:</Text>
                            <Text style={{ fontSize: 13 }}>Giao Hàng Nhanh (Tiêu chuẩn)</Text>
                          </Space>
                        </Col>
                        <Col>
                          {/* Chỗ để hiển thị phí ship riêng nếu API hỗ trợ split order */}
                        </Col>
                      </Row>
                    </div>
                  </Card>
                );
              })}

              {/* Empty State */}
              {checkoutItems.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, background: '#fff', borderRadius: 8 }}>
                  <ShoppingOutlined /> {/* Giả sử có icon này hoặc dùng Empty của Antd */}
                  <Text type="secondary" style={{ display: 'block', margin: '10px 0' }}>Chưa có sản phẩm nào được chọn.</Text>
                  <Button type="primary" onClick={() => navigate("/cart")}>
                    Quay lại giỏ hàng
                  </Button>
                </div>
              )}
            </div>

            <div className="checkout-card">
              <div className="card-header">
                <TagOutlined /> Mã giảm giá
              </div>
              <VoucherSection total={total} onApply={handleApplyVoucher} />
            </div>

            <PaymentMethod payment={payment} setPayment={setPayment} />

            <div className="checkout-card">
              <div className="card-header fs-5 mb-2">
                <FileTextOutlined /> Ghi chú
              </div>
              <TextArea
                rows={2}
                placeholder="Lời nhắn cho người bán hoặc shipper..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>
          </Col>

          {/* === CỘT PHẢI (SUMMARY) === */}
          <Col xs={24} lg={8}>
            <div className="order-summary-wrapper checkout-card">
              <Title level={4}>Đơn hàng</Title>

              <div className="summary-row">
                <Text type="secondary">Tạm tính ({checkoutItems.length} sp)</Text>
                <Text>{intcomma(total)}₫</Text>
              </div>

              <div className="summary-row">
                <Text type="secondary">Phí vận chuyển</Text>
                <Text>{intcomma(shippingFee)}₫</Text>
              </div>

              <div className="summary-row">
                <Text type="secondary">Giảm giá</Text>
                <Text type="success">-{intcomma(discount)}₫</Text>
              </div>

              <Divider style={{ margin: "12px 0" }} />

              <div className="summary-row total">
                <Text>Tổng cộng</Text>
                <div style={{ textAlign: "right" }}>
                  <div className="total-price">
                    {intcomma(totalAfterDiscount)}₫
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    (Đã bao gồm VAT nếu có)
                  </Text>
                </div>
              </div>

              <div className="mobile-hide-btn" style={{ marginTop: 24 }}>
                {renderCheckoutAction()}
                {!isReadyToOrder && (
                  <Text
                    type="danger"
                    style={{
                      fontSize: 12,
                      marginTop: 8,
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    Vui lòng điền đủ thông tin giao hàng
                  </Text>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* === MOBILE BAR === */}
      <div className="mobile-bottom-bar">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng thanh toán
          </Text>
          <div style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 18 }}>
            {intcomma(totalAfterDiscount)}₫
          </div>
        </div>
        <div style={{ width: "50%" }}>{renderCheckoutAction()}</div>
      </div>

      <Modal
        title="Thêm địa chỉ mới"
        open={isAddAddressModalOpen}
        onCancel={() => !isSavingAddress && setIsAddAddressModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose={true}
        maskClosable={!isSavingAddress}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "20px" }}
        style={{ top: 50 }}
      >
        <AddressAddForm
          onSuccess={handleAddressAddedSuccess}
          onCancel={() => setIsAddAddressModalOpen(false)}
        />
        {isSavingAddress && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <Text type="secondary">Đang lưu dữ liệu...</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CheckoutPage;