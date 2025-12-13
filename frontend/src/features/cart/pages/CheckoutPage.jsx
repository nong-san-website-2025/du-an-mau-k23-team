import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { Row, Col, Typography, Divider, Button, Input, Modal, message } from "antd";
import { TagOutlined, FileTextOutlined } from "@ant-design/icons";

// Styles
import "../styles/CheckoutPage.css";

// API
import API from "../../login_register/services/api";

// Components
import useCheckoutLogic from "../hooks/useCheckoutLogic";
import AddressSelector from "../components/AddressSelector";
import ProductList from "../components/ProductList";
import VoucherSection from "../components/VoucherSection";
import PaymentMethod from "../components/PaymentMethod"; 
import PaymentButton from "../components/PaymentButton";
import { intcomma } from "../../../utils/format";

// Import form thêm địa chỉ
import AddressAddForm from "../../users/components/Address/AddressAddForm";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  // State quản lý Modal & Loading
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Lấy data từ hook
  const {
    shippingFee, selectedAddressId, manualEntry, discount, payment,
    isLoading, addresses, total, totalAfterDiscount,
    selectedItems, selectedAddress, customerName, customerPhone,
    addressText, note, 
    setSelectedAddressId, setManualEntry, setPayment, setNote,
    handleApplyVoucher, handleOrder, 
    fetchAddresses,
    setAddresses // <--- Lấy hàm này để cập nhật list thủ công
  } = useCheckoutLogic();

  const isAddressValid = (selectedAddressId && selectedAddress?.location) ||
    (manualEntry && customerName && customerPhone && addressText);
  const isReadyToOrder = selectedItems.length > 0 && isAddressValid && shippingFee > 0;

  // --- HÀM XỬ LÝ QUAN TRỌNG: THÊM VÀ HIỆN NGAY ---
  const handleAddressAddedSuccess = async (newAddressData) => {
    try {
      setIsSavingAddress(true); // Bật loading

      // 1. GỌI API LƯU
      const response = await API.post("users/addresses/", newAddressData);
      
      // 2. LẤY DỮ LIỆU ĐỊA CHỈ VỪA TẠO TỪ SERVER
      // (Response thường trả về object đầy đủ gồm cả ID vừa tạo)
      const createdAddress = response.data;

      message.success("Thêm địa chỉ giao hàng thành công!");

      // 3. CẬP NHẬT TRỰC TIẾP VÀO DANH SÁCH (QUAN TRỌNG)
      // Không cần chờ fetchAddresses, ta nhét thẳng vào state addresses
      if (createdAddress && createdAddress.id) {
        setAddresses((prevList) => [...prevList, createdAddress]);
        
        // 4. TỰ ĐỘNG CHỌN ĐỊA CHỈ MỚI
        setSelectedAddressId(createdAddress.id);
      } else {
        // Fallback: Nếu API server trả về lạ, thì mới gọi fetch lại
        if (typeof fetchAddresses === 'function') await fetchAddresses();
      }

      // 5. Đóng Modal
      setIsAddAddressModalOpen(false);

    } catch (error) {
      console.error("Lỗi khi lưu địa chỉ:", error);
      const errorMsg = error.response?.data?.detail || "Không thể lưu địa chỉ. Vui lòng thử lại!";
      message.error(errorMsg);
    } finally {
      setIsSavingAddress(false); // Tắt loading
    }
  };

  // Render nút thanh toán
  const renderCheckoutAction = () => {
    if (payment === "Ví điện tử") {
      return (
        <PaymentButton
          amount={totalAfterDiscount}
          orderData={{ /* Logic data order */ }}
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
        style={{ height: 48, fontSize: 16, fontWeight: 600, background: '#00b96b', borderColor: '#00b96b' }}
      >
        Đặt hàng
      </Button>
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
              addresses={addresses} // List này sẽ tự cập nhật ngay lập tức nhờ logic trên
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
              manualEntry={manualEntry}
              onToggleManual={() => setManualEntry(!manualEntry)}
              onAddNew={() => setIsAddAddressModalOpen(true)}
            />

            <ProductList cartItems={cartItems} onEditCart={() => navigate("/cart")} />

            <div className="checkout-card">
              <div className="card-header"><TagOutlined /> Mã giảm giá</div>
              <VoucherSection total={total} onApply={handleApplyVoucher} />
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

          {/* === CỘT PHẢI (SUMMARY) === */}
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

      {/* === MOBILE BAR === */}
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

      {/* === MODAL THÊM ĐỊA CHỈ === */}
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
             <div style={{ textAlign: 'center', marginTop: 10 }}>
                 <Text type="secondary">Đang lưu dữ liệu...</Text>
             </div>
        )}
      </Modal>

    </div>
  );
};

export default CheckoutPage;