import React, { useState, useEffect, useMemo } from "react";
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
  Card,
  Avatar,
  Space,
  List,
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
import { getSellerDetail } from "../../sellers/services/sellerService";
import { productApi } from "../../products/services/productApi";

// Components
import useCheckoutLogic from "../hooks/useCheckoutLogic";
import AddressSelector from "../components/AddressSelector";
import VoucherSection from "../components/VoucherSection";
import PaymentMethod from "../components/PaymentMethod";
import PaymentButton from "../components/PaymentButton";
import AddressAddForm from "../../users/components/Address/AddressAddForm";
import { intcomma } from "../../../utils/format";
import { getFinalPrice } from "../../../utils/priceUtils"; // [IMPORT MỚI]

const { Title, Text } = Typography;
const { TextArea } = Input;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  // Set page title
  useEffect(() => {
    const prev = document.title;
    document.title = "GreenFarm - Thanh Toán";
    return () => { document.title = prev; };
  }, []);

  // State chứa dữ liệu đã được làm giàu (có giá, có tên, có shop)
  const [enrichedItems, setEnrichedItems] = useState([]);

  // --- LOCAL STATE ---
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [sellerInfos, setSellerInfos] = useState({});
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [voucherData, setVoucherData] = useState({
    shopDiscount: 0,
    shipDiscount: 0,
    selectedShopVoucher: null,
    selectedShipVoucher: null,
  });

  // --- HOOK LOGIC ---
  const {
    shippingFee,
    selectedAddressId,
    manualEntry,
    payment,
    isLoading,
    addresses,
    selectedAddress,
    customerName,
    customerPhone,
    addressText,
    note,
    setSelectedAddressId,
    setManualEntry,
    setPayment,
    setNote,
    handleOrder: originalHandleOrder,
    addAddress,
    isGuest,
  } = useCheckoutLogic();

  // =================================================================
  // 2. LOGIC VÁ DỮ LIỆU (SELF-HEALING)
  // =================================================================
  useEffect(() => {
    const enrichData = async () => {
      const rawSelectedItems = cartItems.filter((item) => item.selected);
      
      const promises = rawSelectedItems.map(async (item) => {
        const pData = item.product_data || {};
        
        // Lấy dữ liệu sơ bộ từ LocalStorage/CartContext
        let finalPrice = getFinalPrice(item); // [SỬA] Dùng hàm chuẩn
        let finalName = pData.name || item.product_name;
        let finalImage = pData.image || pData.main_image?.image;
        let finalStore = pData.store; 

        // Nếu giá = 0 -> Gọi API lấy lại
        const needsFetch = finalPrice === 0 || !finalStore || (typeof finalStore !== 'object');

        if (needsFetch) {
            try {
                const productId = pData.id || item.product;
                if (productId) {
                    const freshData = await productApi.getProduct(productId);
                    if (freshData) {
                        // [SỬA] Dùng hàm chuẩn để lấy giá từ data mới
                        finalPrice = getFinalPrice(freshData); 
                        finalName = freshData.name;
                        finalImage = freshData.image || freshData.main_image?.image;
                        finalStore = freshData.store;
                    }
                }
            } catch (err) {
                console.warn("Lỗi vá dữ liệu SP:", err);
            }
        }

        return {
            ...item,
            _final_name: finalName || "Sản phẩm",
            _final_price: finalPrice,
            _final_image: finalImage,
            _final_store: finalStore, 
            _store_name_fallback: pData.store_name || "Cửa hàng",
            quantity: Number(item.quantity) || 1
        };
      });

      const results = await Promise.all(promises);
      setEnrichedItems(results);
    };

    enrichData();
  }, [cartItems]);

  // 3. Tính lại TỔNG TIỀN
  const calculateSubtotal = useMemo(() => {
      return enrichedItems.reduce((acc, item) => {
          return acc + (item._final_price * item.quantity);
      }, 0);
  }, [enrichedItems]);

  const finalTotal = useMemo(() => {
    const t = calculateSubtotal;
    const s = Number(shippingFee) || 0;
    const vShop = Number(voucherData?.shopDiscount) || 0;
    const vShip = Number(voucherData?.shipDiscount) || 0;
    return Math.max(0, t + s - vShop - vShip);
  }, [calculateSubtotal, shippingFee, voucherData]);

  const isAddressValid =
    (selectedAddressId && selectedAddress?.location) ||
    (manualEntry && customerName && customerPhone && addressText);
  const isReadyToOrder = enrichedItems.length > 0 && isAddressValid;

  // 4. LOGIC LOAD SELLER INFO
  useEffect(() => {
    const loadSellerInfos = async () => {
      const storeIds = new Set();
      enrichedItems.forEach((item) => {
        const s = item._final_store;
        if (s && s.id) storeIds.add(s.id);
      });

      const newSellerInfos = { ...sellerInfos };
      for (const storeId of storeIds) {
        if (!sellerInfos[storeId]) {
          try {
            const sellerData = await getSellerDetail(storeId);
            newSellerInfos[storeId] = sellerData;
          } catch (err) {
            newSellerInfos[storeId] = { store_name: "Cửa hàng", image: null };
          }
        }
      }
      setSellerInfos(newSellerInfos);
    };

    if (enrichedItems.length > 0) {
      loadSellerInfos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedItems]);

  // 5. GROUP ITEMS BY STORE
  const groupedItems = useMemo(() => {
      return enrichedItems.reduce((acc, item) => {
        const s = item._final_store;
        let storeId = (s && s.id) ? s.id : 'store-less';
        
        if (storeId === 'store-less' && item._store_name_fallback) {
            storeId = `name-${item._store_name_fallback}`;
        }

        if (!acc[storeId]) {
            acc[storeId] = { 
                items: [],
                tempName: s?.store_name || item._store_name_fallback 
            };
        }
        acc[storeId].items.push(item);
        return acc;
      }, {});
  }, [enrichedItems]);

  // --- HANDLERS ---
  const onApplyVoucher = (data) => {
    if (!data) return;
    setVoucherData({
      shopDiscount: Number(data.shopDiscount) || 0,
      shipDiscount: Number(data.shipDiscount) || 0,
      selectedShopVoucher: data.shopVoucher || null,
      selectedShipVoucher: data.shipVoucher || null,
    });
  };

  const onPlaceOrder = async () => {
    try {
      const orderPayload = {
        shop_voucher_code: voucherData.selectedShopVoucher?.voucher?.code,
        ship_voucher_code: voucherData.selectedShipVoucher?.voucher?.code,
      };
      await originalHandleOrder(orderPayload);
    } catch (error) {
      const responseData = error.response?.data;
      if (responseData && responseData.unavailable_items) {
        setUnavailableItems(responseData.unavailable_items);
        setIsStockModalOpen(true);
      } else {
        console.error("Order error:", error);
      }
    }
  };

  const handleToggleManual = () => {
    if (isGuest && manualEntry === true) {
      Modal.confirm({
        title: "Yêu cầu đăng nhập",
        content: "Bạn cần đăng nhập để xem và chọn địa chỉ đã lưu.",
        okText: "Đăng nhập ngay",
        cancelText: "Hủy",
        onOk: () => navigate("/login?redirect=/checkout"),
        centered: true,
      });
      return;
    }
    setManualEntry(!manualEntry);
  };

  const handleAddNewAddressBtn = () => {
    if (isGuest) {
      Modal.confirm({
        title: "Yêu cầu đăng nhập",
        content: "Bạn cần đăng nhập để lưu địa chỉ mới vào tài khoản.",
        okText: "Đăng nhập ngay",
        cancelText: "Đóng",
        onOk: () => navigate("/login?redirect=/checkout"),
        centered: true,
      });
      return;
    }
    setIsAddAddressModalOpen(true);
  };

  const handleAddressAddedSuccess = async (newAddressData) => {
    try {
      setIsSavingAddress(true);
      const createdAddress = await addAddress(newAddressData);
      if (createdAddress && createdAddress.id) {
        setSelectedAddressId(createdAddress.id);
      }
      setIsAddAddressModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi thêm địa chỉ:", error);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // --- RENDERERS ---
  const renderCheckoutAction = () => {
    if (payment === "Ví điện tử") {
      return (
        <PaymentButton
          amount={finalTotal}
          orderData={{
            vouchers: [
              voucherData.selectedShopVoucher,
              voucherData.selectedShipVoucher,
            ].filter(Boolean),
          }}
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
        onClick={onPlaceOrder}
        disabled={!isReadyToOrder}
        className="btn-checkout"
      >
        {payment === "Thanh toán qua VNPAY"
          ? "Thanh toán & Đặt hàng"
          : `Đặt hàng (${intcomma(finalTotal)}₫)`}
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
              onToggleManual={handleToggleManual}
              onAddNew={handleAddNewAddressBtn}
            />

            {/* DANH SÁCH SẢN PHẨM */}
            <div className="checkout-product-groups" style={{ marginBottom: 20 }}>
              {Object.entries(groupedItems).map(([storeKey, group]) => {
                const { items, tempName } = group;
                const sellerInfo = sellerInfos[storeKey] || {};
                const storeName = sellerInfo.store_name || tempName || "Cửa hàng";
                const storeImage = sellerInfo.image;

                return (
                  <Card
                    key={storeKey}
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
                        <Text strong style={{ fontSize: 15 }}>{storeName}</Text>
                        <Divider type="vertical" />
                      </Space>
                    </div>

                    {/* List Items */}
                    <div style={{ padding: "16px" }}>
                      {items.map((item, index) => {
                        const price = item._final_price || 0;
                        const qty = item.quantity || 1;
                        const subtotal = price * qty;

                        return (
                          <div key={item.id || index}>
                            <Row gutter={[16, 16]} align="middle" style={{ flexWrap: "nowrap" }}>
                              <Col flex="80px">
                                <ProductImage src={item._final_image} alt={item._final_name} />
                              </Col>
                              <Col flex="auto">
                                <div style={{ display: "flex", flexDirection: "column", height: "80px", justifyContent: "space-between" }}>
                                  <div>
                                    <Text
                                      ellipsis={{ tooltip: item._final_name }}
                                      style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, maxWidth: "100%", display: "block" }}
                                    >
                                      {item._final_name}
                                    </Text>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                    <Text style={{ fontSize: 13 }}>Đơn giá: {intcomma(price)}₫</Text>
                                    <Text type="secondary">x{qty}</Text>
                                  </div>
                                </div>
                              </Col>
                              <Col flex="100px" style={{ textAlign: "right", alignSelf: "flex-end", paddingBottom: 4 }}>
                                <Text strong style={{ color: "#fa541c", fontSize: 16 }}>{intcomma(subtotal)}₫</Text>
                              </Col>
                            </Row>
                            {index < items.length - 1 && <Divider style={{ margin: "16px 0" }} dashed />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Shop */}
                    <div style={{ padding: "12px 16px", borderTop: "1px dashed #f0f0f0", background: "#fff" }}>
                      <Row align="middle" justify="space-between">
                        <Col>
                          <Space size={4}>
                            <EnvironmentOutlined style={{ color: "#1890ff" }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>Đơn vị vận chuyển:</Text>
                            <Text style={{ fontSize: 13 }}>Giao Hàng Nhanh (Tiêu chuẩn)</Text>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                );
              })}

              {enrichedItems.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 8 }}>
                  <ShoppingOutlined style={{ fontSize: 40, color: "#ccc" }} />
                  <Text type="secondary" style={{ display: "block", margin: "10px 0" }}>Chưa có sản phẩm nào được chọn.</Text>
                  <Button type="primary" onClick={() => navigate("/cart")}>Quay lại giỏ hàng</Button>
                </div>
              )}
            </div>

            <div className="checkout-card">
              <div className="card-header">
                <TagOutlined /> GreenFarm Voucher
              </div>
              <VoucherSection
                total={calculateSubtotal} 
                shippingFee={shippingFee}
                onApply={onApplyVoucher}
              />
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
                <Text type="secondary">Tạm tính ({enrichedItems.length} sp)</Text>
                <Text>{intcomma(calculateSubtotal)}₫</Text>
              </div>

              <div className="summary-row">
                <Text type="secondary">Phí vận chuyển</Text>
                <Text>{intcomma(shippingFee || 0)}₫</Text>
              </div>

              {voucherData.shopDiscount > 0 && (
                <div className="summary-row">
                  <Text type="secondary">Giảm giá Shop</Text>
                  <Text type="success">-{intcomma(voucherData.shopDiscount || 0)}₫</Text>
                </div>
              )}

              {voucherData.shipDiscount > 0 && (
                <div className="summary-row">
                  <Text type="secondary">Hỗ trợ phí ship</Text>
                  <Text style={{ color: "#1677ff" }}>-{intcomma(voucherData.shipDiscount || 0)}₫</Text>
                </div>
              )}

              <Divider style={{ margin: "12px 0" }} />

              <div className="summary-row total">
                <Text>Tổng cộng</Text>
                <div style={{ textAlign: "right" }}>
                  <div className="total-price">{intcomma(finalTotal)}₫</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>(Đã bao gồm VAT)</Text>
                </div>
              </div>

              <div className="mobile-hide-btn" style={{ marginTop: 24 }}>
                {renderCheckoutAction()}
                {!isReadyToOrder && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 8, display: "block", textAlign: "center" }}>
                    Vui lòng chọn địa chỉ và phương thức thanh toán
                  </Text>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <div className="mobile-bottom-bar">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Tổng thanh toán</Text>
          <div style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 18 }}>{intcomma(finalTotal)}₫</div>
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
        style={{ top: 20 }}
      >
        <AddressAddForm onSuccess={handleAddressAddedSuccess} onCancel={() => setIsAddAddressModalOpen(false)} />
        {isSavingAddress && <div style={{ textAlign: "center", marginTop: 10 }}><Text type="secondary">Đang lưu dữ liệu...</Text></div>}
      </Modal>

      <Modal
        open={isStockModalOpen}
        title={<div style={{ color: "#ff4d4f", display: "flex", alignItems: "center", gap: 8 }}><ExclamationCircleFilled /><span>Sản phẩm hết hàng hoặc không đủ số lượng</span></div>}
        onCancel={() => setIsStockModalOpen(false)}
        footer={[
          <Button key="cart" onClick={() => navigate("/cart")}>Về giỏ hàng</Button>,
          <Button key="ok" type="primary" danger onClick={() => setIsStockModalOpen(false)}>Đã hiểu</Button>,
        ]}
        centered
      >
        <p style={{ marginBottom: 16 }}>Các sản phẩm sau đây hiện không đủ số lượng để cung cấp. Vui lòng điều chỉnh lại giỏ hàng của bạn.</p>
        <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #f0f0f0", borderRadius: 8 }}>
          <List
            itemLayout="horizontal"
            dataSource={unavailableItems}
            renderItem={(item) => (
              <List.Item style={{ padding: "12px" }}>
                <List.Item.Meta
                  avatar={<Avatar shape="square" size={64} src={item.image} icon={<PictureOutlined />} />}
                  title={<Text strong style={{ fontSize: 14 }}>{item.product_name || item.name}</Text>}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Số lượng yêu cầu: {item.requested_quantity}</Text>
                      <Text type="danger" strong style={{ fontSize: 12 }}><WarningOutlined /> {item.available_quantity > 0 ? `Chỉ còn ${item.available_quantity}` : "Đã hết hàng"}</Text>
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