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
  List,
  Tag,
} from "antd";
import {
  TagOutlined,
  FileTextOutlined,
  ShopOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  ShoppingOutlined,
  ExclamationCircleFilled,
  WarningOutlined,
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

  // Lọc sản phẩm được chọn để thanh toán
  const checkoutItems = cartItems.filter((item) => item.selected);

  // --- LOCAL STATE ---
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [sellerInfos, setSellerInfos] = useState({});

  // State cho Modal hết hàng
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);

  // --- HOOK LOGIC ---
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
    setAddresses,
  } = useCheckoutLogic();

  // Validate điều kiện đặt hàng
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
        const storeId = item.product_data?.store?.id || item.product?.store?.id;
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

  // 3. XỬ LÝ ĐẶT HÀNG (WRAPPER)
  const onPlaceOrder = async () => {
    try {
      // Gọi handleOrder từ hook logic
      // Hook đã được sửa để throw error nếu gặp lỗi unavailable_items
      await handleOrder();
    } catch (error) {
      const responseData = error.response?.data;

      // Kiểm tra key 'unavailable_items' trả về từ Backend
      if (responseData && responseData.unavailable_items) {
        setUnavailableItems(responseData.unavailable_items);
        setIsStockModalOpen(true);
      } else {
        // Các lỗi khác đã được handleOrder hiển thị notification
        // hoặc xử lý thêm ở đây nếu cần
        console.error("Order error:", error);
      }
    }
  };

  // 4. XỬ LÝ THÊM ĐỊA CHỈ MỚI
  const handleAddressAddedSuccess = async (newAddressData) => {
    try {
      setIsSavingAddress(true);
      const response = await API.post("users/addresses/", newAddressData);
      const createdAddress = response.data;
      message.success("Thêm địa chỉ giao hàng thành công!");

      if (createdAddress && createdAddress.id) {
        setAddresses((prevList) => [...prevList, createdAddress]);
        setSelectedAddressId(createdAddress.id);
      } else {
        if (typeof fetchAddresses === "function") await fetchAddresses();
      }
      setIsAddAddressModalOpen(false);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Lỗi lưu địa chỉ!";
      message.error(errorMsg);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // --- RENDERERS ---

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
        // QUAN TRỌNG: Gọi onPlaceOrder để bắt lỗi try/catch
        onClick={onPlaceOrder}
        disabled={!isReadyToOrder}
        style={{
          height: 48,
          fontSize: 16,
          fontWeight: 600,
          background: "#00b96b",
          borderColor: "#00b96b",
          boxShadow: "0 4px 14px 0 rgba(0,185,107,0.39)",
        }}
      >
        {payment === "Thanh toán qua VNPAY"
          ? "Thanh toán & Đặt hàng"
          : "Đặt hàng"}
      </Button>
    );
  };

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

            {/* DANH SÁCH SẢN PHẨM */}
            <div
              className="checkout-product-groups"
              style={{ marginBottom: 20 }}
            >
              {Object.entries(groupedItems).map(([storeId, { items }]) => {
                const sellerInfo = sellerInfos[storeId] || {};
                const storeName = sellerInfo.store_name || "Cửa hàng";
                const storeImage = sellerInfo.image;

                return (
                  <Card
                    key={storeId}
                    className="checkout-card"
                    bodyStyle={{ padding: "0" }}
                    style={{ marginBottom: 16, overflow: "hidden" }}
                  >
                    {/* Header Shop */}
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

                    {/* List Items */}
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
                              style={{ flexWrap: "nowrap" }}
                            >
                              <Col flex="80px">
                                <ProductImage
                                  src={prod.image}
                                  alt={prod.name}
                                />
                              </Col>
                              <Col flex="auto">
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "80px",
                                    justifyContent: "space-between",
                                  }}
                                >
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
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-end",
                                    }}
                                  >
                                    <Text style={{ fontSize: 13 }}>
                                      Đơn giá: {intcomma(price)}₫
                                    </Text>
                                    <Text type="secondary">x{qty}</Text>
                                  </div>
                                </div>
                              </Col>
                              <Col
                                flex="100px"
                                style={{
                                  textAlign: "right",
                                  alignSelf: "flex-end",
                                  paddingBottom: 4,
                                }}
                              >
                                <Text
                                  strong
                                  style={{ color: "#fa541c", fontSize: 16 }}
                                >
                                  {intcomma(subtotal)}₫
                                </Text>
                              </Col>
                            </Row>
                            {index < items.length - 1 && (
                              <Divider style={{ margin: "16px 0" }} dashed />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Shop */}
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
                            <EnvironmentOutlined style={{ color: "#1890ff" }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              Vận chuyển:
                            </Text>
                            <Text style={{ fontSize: 13 }}>
                              Tiêu chuẩn (Giao Hàng Nhanh)
                            </Text>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                );
              })}

              {/* Empty State */}
              {checkoutItems.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    background: "#fff",
                    borderRadius: 8,
                  }}
                >
                  <ShoppingOutlined style={{ fontSize: 40, color: "#ccc" }} />
                  <Text
                    type="secondary"
                    style={{ display: "block", margin: "10px 0" }}
                  >
                    Chưa có sản phẩm nào được chọn.
                  </Text>
                  <Button type="primary" onClick={() => navigate("/cart")}>
                    Quay lại giỏ hàng
                  </Button>
                </div>
              )}
            </div>

            {/* Voucher & Payment */}
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
                <Text type="secondary">
                  Tạm tính ({checkoutItems.length} sp)
                </Text>
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
                    (Đã bao gồm VAT)
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
                    Vui lòng chọn địa chỉ và phương thức thanh toán
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

      {/* === MODAL THÊM ĐỊA CHỈ === */}
      <Modal
        title="Thêm địa chỉ mới"
        open={isAddAddressModalOpen}
        onCancel={() => !isSavingAddress && setIsAddAddressModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose={true}
        maskClosable={!isSavingAddress}
        style={{ top: 20 }}
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

      {/* === MODAL CẢNH BÁO HẾT HÀNG (MỚI) === */}
      <Modal
        open={isStockModalOpen}
        title={
          <div
            style={{
              color: "#ff4d4f",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ExclamationCircleFilled />
            <span>Sản phẩm hết hàng hoặc không đủ số lượng</span>
          </div>
        }
        onCancel={() => setIsStockModalOpen(false)}
        footer={[
          <Button key="cart" onClick={() => navigate("/cart")}>
            Về giỏ hàng
          </Button>,
          <Button
            key="ok"
            type="primary"
            danger
            onClick={() => setIsStockModalOpen(false)}
          >
            Đã hiểu
          </Button>,
        ]}
        centered
      >
        <p style={{ marginBottom: 16 }}>
          Các sản phẩm sau đây hiện không đủ số lượng để cung cấp. Vui lòng điều
          chỉnh lại giỏ hàng của bạn.
        </p>
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #f0f0f0",
            borderRadius: 8,
          }}
        >
          <List
            itemLayout="horizontal"
            dataSource={unavailableItems}
            renderItem={(item) => (
              <List.Item style={{ padding: "12px" }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      shape="square"
                      size={64}
                      src={item.image}
                      icon={<PictureOutlined />}
                    />
                  }
                  title={
                    <Text strong style={{ fontSize: 14 }}>
                      {item.product_name || item.name}
                    </Text>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Số lượng yêu cầu: {item.requested_quantity}
                      </Text>
                      <Text type="danger" strong style={{ fontSize: 12 }}>
                        <WarningOutlined />{" "}
                        {item.available_quantity > 0
                          ? `Chỉ còn ${item.available_quantity}`
                          : "Đã hết hàng"}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
