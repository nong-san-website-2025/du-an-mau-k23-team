// src/features/cart/pages/CheckoutPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { Row, Col, Typography, Divider, Button, Input, message } from "antd";
import { TagOutlined, FileTextOutlined } from "@ant-design/icons";

// Styles
import "../styles/CheckoutPage.css";

// Components
import useCheckoutLogic from "../hooks/useCheckoutLogic";
import AddressSelector from "../components/AddressSelector";
import ProductList from "../components/ProductList";
import VoucherSection from "../components/VoucherSection";
import PaymentMethod from "../components/PaymentMethod"; // Component mới tách
import PaymentButton from "../components/PaymentButton";
import { intcomma } from "../../../utils/format";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const {
    shippingFee, selectedAddressId, manualEntry, discount, payment,
    isLoading, token, addresses, total, totalAfterDiscount,
    selectedItems, selectedAddress, customerName, customerPhone,
    addressText, note, geoManual,
    setSelectedAddressId, setManualEntry, setPayment, setCustomerName,
    setCustomerPhone, setAddressText, setNote, setGeoManual, shippingStatus,
    handleApplyVoucher, handleOrder, handleSaveManualAddress,
  } = useCheckoutLogic();

  const isAddressValid = (selectedAddressId && selectedAddress?.location) ||
    (manualEntry && customerName && customerPhone && addressText);
  const isReadyToOrder = selectedItems.length > 0 && isAddressValid && shippingFee > 0;

  // Render nút thanh toán chung (dùng lại cho cả Desktop và Mobile)
  const renderCheckoutAction = () => {
    if (payment === "Ví điện tử") {
      return (
        <PaymentButton
          amount={totalAfterDiscount}
          orderData={{ /* Logic data order */ }}
          disabled={!isReadyToOrder || isLoading}
        />
      )
    }
    return (
      <Button
        type="primary"
        size="large"
        block
        loading={isLoading}
        onClick={handleOrder}
        disabled={!isReadyToOrder}
        style={{ height: 48, fontSize: 16, fontWeight: 600, background: '#00b96b', borderColor: '#00b96b' }}
      >
        Đặt hàng
      </Button>
    )
  }

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        <div className="checkout-title">Thanh toán</div>

        <Row gutter={24}>
          {/* === CỘT TRÁI: THÔNG TIN === */}
          <Col xs={24} lg={16}>
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
              manualEntry={manualEntry}
              onToggleManual={() => setManualEntry(!manualEntry)}
            /* Truyền thêm props manual nếu cần */
            />

            <ProductList cartItems={cartItems} onEditCart={() => navigate("/cart")} />

            <div className="checkout-card">
              <div className="card-header"><TagOutlined /> Mã giảm giá</div>
              <VoucherSection total={total} onApply={handleApplyVoucher} />
            </div>

            <PaymentMethod payment={payment} setPayment={setPayment} />

            <div className="checkout-card">
              <div className="card-header"><FileTextOutlined /> Ghi chú</div>
              <TextArea
                rows={2}
                placeholder="Lời nhắn cho người bán hoặc shipper..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>
          </Col>

          {/* === CỘT PHẢI: TÓM TẮT (Desktop Sticky) === */}
          <Col xs={24} lg={8}>
            <div className="order-summary-wrapper checkout-card">
              <Title level={4}>Đơn hàng</Title>

              <div className="summary-row">
                <Text type="secondary">Tạm tính</Text>
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
                <div style={{ textAlign: 'right' }}>
                  <div className="total-price">{intcomma(totalAfterDiscount)}₫</div>

                </div>
              </div>

              <div className="mobile-hide-btn" style={{ marginTop: 24 }}>
                {renderCheckoutAction()}
                {!isReadyToOrder && <Text type="danger" style={{ fontSize: 12, marginTop: 8, display: 'block', textAlign: 'center' }}>Vui lòng điền đủ thông tin</Text>}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* === MOBILE STICKY BOTTOM BAR === */}
      <div className="mobile-bottom-bar">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Tổng thanh toán</Text>
          <div style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 18 }}>
            {totalAfterDiscount.toLocaleString('vi-VN')}₫
          </div>
        </div>
        <div style={{ width: '50%' }}>
          {renderCheckoutAction()}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;