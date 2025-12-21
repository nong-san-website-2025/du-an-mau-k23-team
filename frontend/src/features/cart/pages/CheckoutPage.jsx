import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { Row, Col, Typography, Divider, Button, Input } from "antd";
import { TagOutlined, FileTextOutlined } from "@ant-design/icons";

// Styles
import "../styles/CheckoutPage.css";

// Components
import useCheckoutLogic from "../hooks/useCheckoutLogic";
import AddressSelector from "../components/AddressSelector";
import ProductList from "../components/ProductList";
import VoucherSection from "../components/VoucherSection"; // Đã update bản mới
import PaymentMethod from "../components/PaymentMethod"; 
import PaymentButton from "../components/PaymentButton";
import { intcomma } from "../../../utils/format";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  // 1. Lấy logic từ Hook (cần sửa Hook một chút để hỗ trợ 2 loại discount)
  // Nếu Hook cũ chỉ trả về 1 biến 'discount', ta sẽ override nó ở đây bằng state cục bộ
  const {
    shippingFee, selectedAddressId, manualEntry, payment,
    isLoading, addresses, total, 
    // totalAfterDiscount (Hook cũ tính), ta sẽ tự tính lại ở đây cho chuẩn combo
    selectedItems, selectedAddress, customerName, customerPhone,
    addressText, note, 
    setSelectedAddressId, setManualEntry, setPayment, setNote, 
    handleOrder: originalHandleOrder, // Đổi tên để wrap lại nếu cần
  } = useCheckoutLogic();

  // 2. State quản lý Voucher Combo (Local State thay vì dùng từ Hook cũ)
  const [voucherData, setVoucherData] = useState({
      shopDiscount: 0,
      shipDiscount: 0,
      selectedShopVoucher: null,
      selectedShipVoucher: null
  });

  // 3. Tính toán lại Tổng tiền cuối cùng
  // Subtotal + Ship - ShopDiscount - ShipDiscount
  // (Đảm bảo không âm)
  const finalTotal = Math.max(0, total + shippingFee - voucherData.shopDiscount - voucherData.shipDiscount);

  // 4. Hàm xử lý khi chọn Voucher từ Component con
  const onApplyVoucher = (data) => {
      // data: { shopVoucher, shipVoucher, shopDiscount, shipDiscount, totalDiscount }
      setVoucherData(data);
  };

  // 5. Wrap hàm đặt hàng để gửi kèm thông tin 2 voucher (nếu backend hỗ trợ)
  const handleCheckout = () => {
      // Chuẩn bị payload mở rộng (nếu cần)
      const orderPayload = {
          shop_voucher_code: voucherData.selectedShopVoucher?.voucher?.code,
          ship_voucher_code: voucherData.selectedShipVoucher?.voucher?.code,
          // ... các field khác
      };
      
      // Gọi hàm gốc từ hook (bạn cần đảm bảo hook nhận được voucher codes này)
      // Cách đơn giản nhất: Lưu voucher vào state của Hook hoặc truyền tham số
      originalHandleOrder(orderPayload); 
  };

  const isAddressValid = (selectedAddressId && selectedAddress?.location) ||
    (manualEntry && customerName && customerPhone && addressText);
  
  const isReadyToOrder = selectedItems.length > 0 && isAddressValid && shippingFee > 0;

  // --- RENDER ACTION BUTTON ---
  const renderCheckoutAction = () => {
    if (payment === "Ví điện tử") {
      return (
        <PaymentButton
          amount={finalTotal} // Dùng finalTotal mới tính
          orderData={{ 
              /* data order cần thiết */ 
              vouchers: [voucherData.selectedShopVoucher, voucherData.selectedShipVoucher].filter(Boolean)
          }}
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
        onClick={handleCheckout}
        disabled={!isReadyToOrder}
        style={{ height: 48, fontSize: 16, fontWeight: 600, background: '#00b96b', borderColor: '#00b96b' }}
      >
        Đặt hàng ({intcomma(finalTotal)}₫)
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
            />

            <ProductList cartItems={cartItems} onEditCart={() => navigate("/cart")} />

            <div className="checkout-card">
              <div className="card-header"><TagOutlined /> GreenFarm Voucher</div>
              {/* [QUAN TRỌNG] Truyền đủ props cho VoucherSection mới */}
              <VoucherSection 
                  total={total} 
                  shippingFee={shippingFee} 
                  onApply={onApplyVoucher} 
              />
            </div>

            <PaymentMethod payment={payment} setPayment={setPayment} />

            <div className="checkout-card">
              <div className="card-header fs-5 mb-2" ><FileTextOutlined /> Ghi chú</div>
              <TextArea
                rows={2}
                placeholder="Lời nhắn cho người bán hoặc shipper..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>
          </Col>

          {/* === CỘT PHẢI: TÓM TẮT ĐƠN HÀNG === */}
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

              {/* Hiển thị chi tiết từng loại giảm giá */}
              {voucherData.shopDiscount > 0 && (
                  <div className="summary-row">
                    <Text type="secondary">Giảm giá Shop</Text>
                    <Text type="success">-{intcomma(voucherData.shopDiscount)}₫</Text>
                  </div>
              )}

              {voucherData.shipDiscount > 0 && (
                  <div className="summary-row">
                    <Text type="secondary">Hỗ trợ phí ship</Text>
                    <Text style={{color: '#1677ff'}}>-{intcomma(voucherData.shipDiscount)}₫</Text>
                  </div>
              )}

              <Divider style={{ margin: "12px 0" }} />

              <div className="summary-row total">
                <Text>Tổng cộng</Text>
                <div style={{ textAlign: 'right' }}>
                  <div className="total-price">{intcomma(finalTotal)}₫</div>
                  <Text type="secondary" style={{fontSize: 12}}>(Đã bao gồm VAT)</Text>
                </div>
              </div>

              <div className="mobile-hide-btn" style={{ marginTop: 24 }}>
                {renderCheckoutAction()}
                {!isReadyToOrder && <Text type="danger" style={{ fontSize: 12, marginTop: 8, display: 'block', textAlign: 'center' }}>Vui lòng chọn địa chỉ và phương thức thanh toán</Text>}
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
            {intcomma(finalTotal)}₫
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