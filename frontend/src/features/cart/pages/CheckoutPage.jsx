// src/features/checkout/pages/CheckoutPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../services/CartContext";
import { 
  Row, Col, Typography, Divider, Button, Input, Modal, message, 
  Card, Avatar
} from "antd";
import { TagOutlined, FileTextOutlined, ShopOutlined } from "@ant-design/icons";

// Styles
import "../styles/CheckoutPage.css";

// API & Services
import API from "../../login_register/services/api";
import { getSellerDetail } from "../../sellers/services/sellerService"; // ✅ Import service lấy thông tin shop

// Components
import useCheckoutLogic from "../hooks/useCheckoutLogic";
import AddressSelector from "../components/AddressSelector";
import VoucherSection from "../components/VoucherSection";
import PaymentMethod from "../components/PaymentMethod"; 
import PaymentButton from "../components/PaymentButton";
import AddressAddForm from "../../users/components/Address/AddressAddForm";
import { intcomma } from "../../../utils/format"; // Hoặc import formatVND của bạn

const { Title, Text } = Typography;
const { TextArea } = Input;

const CheckoutPage = () => {
  const navigate = useNavigate();
  // Lấy cartItems, lưu ý ta chỉ render những item ĐÃ ĐƯỢC CHỌN (selected)
  const { cartItems } = useCart();
  
  // Lọc ra các sản phẩm được chọn để thanh toán
  const checkoutItems = cartItems.filter(item => item.selected);

  // State quản lý Modal & Loading
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  // ✅ State lưu thông tin các cửa hàng (để hiển thị tên/avatar shop)
  const [sellerInfos, setSellerInfos] = useState({}); 

  // Lấy data từ hook logic
  const {
    shippingFee, selectedAddressId, manualEntry, discount, payment,
    isLoading, addresses, total, totalAfterDiscount,
    selectedItems, selectedAddress, customerName, customerPhone,
    addressText, note, 
    setSelectedAddressId, setManualEntry, setPayment, setNote,
    handleApplyVoucher, handleOrder, 
    fetchAddresses,
    setAddresses 
  } = useCheckoutLogic();

  const isAddressValid = (selectedAddressId && selectedAddress?.location) ||
    (manualEntry && customerName && customerPhone && addressText);
  const isReadyToOrder = selectedItems.length > 0 && isAddressValid && shippingFee > 0;

  // ----------------------------------------------------------------
  // ✅ 1. LOGIC LOAD THÔNG TIN SELLER (Giống CartPage)
  // ----------------------------------------------------------------
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
            console.warn(`❌ Không tải được thông tin seller ${storeId}:`, err);
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
  }, [cartItems]); // Chạy lại khi cart thay đổi

  // ----------------------------------------------------------------
  // ✅ 2. LOGIC NHÓM SẢN PHẨM THEO STORE ID
  // ----------------------------------------------------------------
  const groupedItems = checkoutItems.reduce((acc, item) => {
    const storeId = item.product_data?.store?.id || item.product?.store?.id || "store-less";
    if (!acc[storeId]) {
      acc[storeId] = { items: [] };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  // ----------------------------------------------------------------
  // LOGIC ĐỊA CHỈ (Giữ nguyên)
  // ----------------------------------------------------------------
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
        if (typeof fetchAddresses === 'function') await fetchAddresses();
      }
      setIsAddAddressModalOpen(false);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Lỗi lưu địa chỉ!";
      message.error(errorMsg);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const renderCheckoutAction = () => {
    if (payment === "Ví điện tử") {
      return (
        <PaymentButton
          amount={totalAfterDiscount}
          orderData={{}} // Điền order data thực tế
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
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
              manualEntry={manualEntry}
              onToggleManual={() => setManualEntry(!manualEntry)}
              onAddNew={() => setIsAddAddressModalOpen(true)}
            />

            {/* ----------------------------------------------------- */}
            {/* ✅ 3. HIỂN THỊ DANH SÁCH THEO NHÓM CỬA HÀNG */}
            {/* ----------------------------------------------------- */}
            <div className="checkout-product-groups" style={{ marginBottom: 20 }}>
              {Object.entries(groupedItems).map(([storeId, { items }]) => {
                const sellerInfo = sellerInfos[storeId] || {};
                const storeName = sellerInfo.store_name || "Cửa hàng";
                const storeImage = sellerInfo.image;

                return (
                  <Card 
                    key={storeId} 
                    className="checkout-card" 
                    bodyStyle={{ padding: '16px' }}
                    style={{ marginBottom: 16 }}
                  >
                    {/* Header Shop */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                      <Avatar src={storeImage} icon={<ShopOutlined />} size="small" style={{ marginRight: 8 }} />
                      <Text strong>{storeName}</Text>
                    </div>

                    {/* List Items trong Shop đó */}
                    {items.map((item) => {
                      const prod = item.product_data || item.product || {};
                      const price = Number(prod.price) || 0;
                      const qty = Number(item.quantity) || 1;
                      
                      return (
                        <div key={item.id || prod.id} style={{ display: 'flex', marginBottom: 12 }}>
                          <div style={{ marginRight: 12 }}>
                             <img 
                               src={prod.image} 
                               alt={prod.name} 
                               style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, background: '#f5f5f5' }} 
                             />
                          </div>
                          <div style={{ flex: 1 }}>
                            <Text ellipsis style={{ width: '100%', display: 'block' }}>{prod.name}</Text>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 13 }}>x{qty}</Text>
                              <Text strong>{intcomma(price * qty)}₫</Text>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* (Optional) Có thể thêm phần chọn đơn vị vận chuyển riêng cho từng shop tại đây */}
                  </Card>
                );
              })}
              
              {checkoutItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Text type="secondary">Chưa có sản phẩm nào được chọn.</Text>
                  <Button type="link" onClick={() => navigate('/cart')}>Quay lại giỏ hàng</Button>
                </div>
              )}
            </div>

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
                <div style={{ textAlign: 'right' }}>
                  <div className="total-price">{intcomma(totalAfterDiscount)}₫</div>
                </div>
              </div>

              <div className="mobile-hide-btn" style={{ marginTop: 24 }}>
                {renderCheckoutAction()}
                {!isReadyToOrder && <Text type="danger" style={{ fontSize: 12, marginTop: 8, display: 'block', textAlign: 'center' }}>Vui lòng điền đủ thông tin giao hàng</Text>}
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
            {intcomma(totalAfterDiscount)}₫
          </div>
        </div>
        <div style={{ width: '50%' }}>
          {renderCheckoutAction()}
        </div>
      </div>

      {/* Modal thêm địa chỉ (Giữ nguyên) */}
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