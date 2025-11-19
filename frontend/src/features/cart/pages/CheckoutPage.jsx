// src/features/cart/pages/CheckoutPage.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import {
  Typography,
  Button,
  Select,
  Row,
  Col,
  Space,
  Divider,
  Input,
  Tooltip,
} from "antd";
import {
  EnvironmentOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  CreditCardOutlined,
  TagOutlined,
  InfoCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";

// Giả định import custom hook và component con đã tồn tại
import useCheckoutLogic from "../hooks/useCheckoutLogic";
import PaymentButton from "../components/PaymnentButton";
import AddressSelector from "../components/AddressSelector"; // Cần update AddressSelector để nhận thêm props
import VoucherSection from "../components/VoucherSection";
import ProductList from "../components/ProductList";
import "../styles/CheckoutPage.css"; // Đảm bảo có CSS cho sticky và layout

const { Title, Text } = Typography;
const { TextArea } = Input;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const {
    shippingFee,
    selectedAddressId,
    manualEntry,
    discount,
    payment,
    isLoading,
    token,
    addresses,
    total,
    totalAfterDiscount,
    selectedItems,
    selectedAddress, // Lấy từ hook
    customerName,
    customerPhone,
    addressText,
    note,
    geoManual, // Lấy từ hook

    // Setters
    setSelectedAddressId,
    setManualEntry,
    setPayment,
    setCustomerName,
    setCustomerPhone,
    setAddressText,
    setNote,
    setGeoManual,
    shippingStatus,

    // Handlers
    handleApplyVoucher,
    handleOrder,
    handleSaveManualAddress, // Lấy từ hook
  } = useCheckoutLogic();

  // Kiểm tra tính hợp lệ cơ bản cho việc đặt hàng
  const isAddressValid =
    (selectedAddressId && selectedAddress?.location) ||
    (manualEntry &&
      customerName &&
      customerPhone &&
      addressText &&
      geoManual.districtId);

  const isReadyToOrder =
    selectedItems.length > 0 && isAddressValid && shippingFee > 0;

  // --- Cấu trúc Layout 2 Cột ---
  return (
    <Row gutter={[32, 24]} className="checkout-container">
      <Col xs={24}>
        <Title level={2} style={{ marginBottom: 20, fontWeight: 700 }}>
          Thanh toán đơn hàng
        </Title>
      </Col>

      {/* ==================== LEFT COLUMN ==================== */}
      <Col xs={24} lg={14} xl={16}>
        {/* --- Địa chỉ giao hàng --- */}
        <div className="checkout-section">
          <Title level={4} className="section-title">
            <EnvironmentOutlined /> Địa chỉ Giao hàng
          </Title>

          <AddressSelector
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelect={setSelectedAddressId}
            onManage={() => navigate("/profile?tab=address&redirect=checkout")}
            onToggleManual={() => setManualEntry(!manualEntry)}
            manualEntry={manualEntry}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            addressText={addressText}
            setAddressText={setAddressText}
            geoManual={geoManual}
            setGeoManual={setGeoManual}
            onSaveManual={handleSaveManualAddress}
          />

          {!isAddressValid && (
            <Text type="danger" style={{ marginTop: 8, display: "block" }}>
              <InfoCircleOutlined /> Vui lòng chọn hoặc nhập đầy đủ địa chỉ giao
              hàng.
            </Text>
          )}
        </div>

        {/* --- Sản phẩm --- */}
        <div className="checkout-section">
          <Title level={4} className="section-title">
            <ShoppingOutlined /> Sản phẩm ({selectedItems.length} mặt hàng)
          </Title>
          <ProductList
            cartItems={cartItems}
            onEditCart={() => navigate("/cart")}
          />
        </div>

        {/* --- Voucher --- */}
        <div className="checkout-section">
          <Title level={4} className="section-title">
            <TagOutlined /> Mã giảm giá
          </Title>

          {!token ? (
            <div className="voucher-login-prompt">
              💡 <strong>Đăng nhập</strong> để sử dụng voucher giảm giá!
            </div>
          ) : (
            <VoucherSection total={total} onApply={handleApplyVoucher} />
          )}
        </div>

        {/* --- Thanh toán --- */}
        <div className="checkout-section">
          <Title level={4} className="section-title">
            <DollarCircleOutlined /> Phương thức Thanh toán
          </Title>

          <Select
            size="large"
            value={payment}
            onChange={setPayment}
            style={{ width: "100%" }}
          >
            <Select.Option value="Thanh toán khi nhận hàng">
              <Space>
                <CreditCardOutlined /> Thanh toán khi nhận hàng (COD)
              </Space>
            </Select.Option>

            <Select.Option value="Ví điện tử">
              <Space>
                <CreditCardOutlined /> Thanh toán qua VNPAY
              </Space>
            </Select.Option>
          </Select>
        </div>

        {/* --- Ghi chú --- */}
        <div className="checkout-section">
          <Title level={4} className="section-title">
            <SaveOutlined /> Ghi chú đơn hàng
          </Title>

          <TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: giao giờ hành chính, gọi trước khi đến..."
          />
        </div>
      </Col>

      {/* ==================== RIGHT COLUMN ==================== */}
      <Col xs={24} lg={10} xl={8}>
        <div className="order-summary-sticky">
          <Title level={3} style={{ marginBottom: 16 }}>
            Tóm tắt Đơn hàng
          </Title>

          <Space direction="vertical" style={{ width: "100%" }}>
            <div className="price-row">
              <Text>Tạm tính:</Text>
              <Text>{total.toLocaleString()}đ</Text>
            </div>

            <div className="price-row">
              <Text>Phí vận chuyển:</Text>

              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Text strong>
                  {shippingFee > 0 ? shippingFee.toLocaleString() + "đ" : "—"}
                </Text>
                {shippingStatus === "loading" && (
                  <Text type="secondary">(Đang tính...)</Text>
                )}
              </span>
            </div>

            <div className="price-row">
              <Text>Giảm giá Voucher:</Text>
              <Text type="danger">- {discount.toLocaleString()}đ</Text>
            </div>
          </Space>

          <Divider />

          <div className="price-row total-row">
            <Text strong >Tổng thanh toán:</Text>
            <Text strong className="total-amount" style={{color: "#4caf50"}}>
              {totalAfterDiscount.toLocaleString()}đ
            </Text>
          </div>

          <Divider />

          {payment === "Ví điện tử" ? (
            <PaymentButton
              className="custom-pay-btn"
              title="Thanh toán qua VNPAY"
              amount={totalAfterDiscount}
              orderData={{
                total_price: totalAfterDiscount,
                customer_name: manualEntry
                  ? customerName
                  : selectedAddress?.recipient_name,
                customer_phone: manualEntry
                  ? customerPhone
                  : selectedAddress?.phone,
                address: manualEntry ? addressText : selectedAddress?.location,
                note,
                items: selectedItems.map((item) => ({
                  product: item.product?.id || item.product,
                  quantity: parseInt(item.quantity),
                  price: parseFloat(item.product?.price),
                })),
              }}
              disabled={!isReadyToOrder || isLoading}
            />
          ) : (
            <Button
              type="primary"
              size="large"
              className="confirm-order-btn"
              loading={isLoading}
              onClick={handleOrder}
              disabled={!isReadyToOrder}
              style={{backgroundColor: "#4caf50"}}
            >
              Xác nhận Đặt hàng (COD)
            </Button>
          )}

          {!isReadyToOrder && (
            <div className="error-message">
              <InfoCircleOutlined /> Vui lòng nhập địa chỉ đầy đủ và chọn sản
              phẩm.
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default CheckoutPage;
