import React, { useState, useEffect, useMemo } from "react";
import { useCart, getItemProductId } from "../services/CartContext";
import { useAuth } from "../../login_register/services/AuthContext";
import {
  Button,
  Modal,
  Checkbox,
  Row,
  Col,
  Avatar,
  Typography,
  Divider,
  Empty,
  Card,
  Popover
} from "antd";
import { Store, ArrowRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../products/services/productApi";
import { formatVND } from "../../stores/components/StoreDetail/utils/utils";
import QuantityInput from "./QuantityInput";
import { getSellerDetail } from "../../sellers/services/sellerService";
import { getMyVouchers } from "../../admin/services/promotionServices";
import NoImage from "../../../components/shared/NoImage";
import Layout from "../../../layout/LayoutDefault";
import "../styles/CartPage.css";
import { intcomma } from "../../../utils/format";
import { getFinalPrice } from "../../../utils/priceUtils"; // [IMPORT MỚI]

const { Text, Title } = Typography;

function CartPage() {
  const { cartItems, clearCart, selectAllItems, deselectAllItems, toggleItem } = useCart();

  // --- STATE ---
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sellerInfos, setSellerInfos] = useState({});
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  // State từ TruongAn1
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [userVouchers, setUserVouchers] = useState([]);
  const [voucherModal, setVoucherModal] = useState({
    visible: false,
    storeId: null,
    storeName: "",
  });

  // --- 1. LOAD DATA ---

  // Load Voucher
  useEffect(() => {
    if (!isAuthenticated()) {
      setUserVouchers([]);
      return;
    }

    const fetchVouchers = async () => {
      try {
        const res = await getMyVouchers();
        setUserVouchers(Array.isArray(res) ? res : []);
      } catch (err) {
        setUserVouchers([]);
      }
    };
    fetchVouchers();
  }, [isAuthenticated]);

  // Load Seller Info
  useEffect(() => {
    if (!cartItems.length) return;
    const loadSellerInfos = async () => {
      const storeIds = new Set();
      cartItems.forEach((item) => {
        const pData = item.product_data || {};
        const pSource = typeof item.product === 'object' ? item.product : {};
        // Lấy store ID an toàn hơn
        const storeId = pData.store?.id || pData.store || pSource.store?.id || pSource.store;
        
        if (storeId && (typeof storeId === 'number' || typeof storeId === 'string')) {
            storeIds.add(storeId);
        }
      });

      const missingStores = [...storeIds].filter(id => !sellerInfos[id]);
      if (missingStores.length === 0) return;

      const newInfos = { ...sellerInfos };
      await Promise.all(missingStores.map(async (id) => {
        try {
          const data = await getSellerDetail(id);
          newInfos[id] = data;
        } catch {
          newInfos[id] = { store_name: "Cửa hàng", image: null };
        }
      }));
      setSellerInfos(newInfos);
    };
    loadSellerInfos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // Load Related Products
  useEffect(() => {
    const loadRelated = async () => {
      try {
        if (!cartItems || cartItems.length === 0) return;
        const lastItem = cartItems[cartItems.length - 1];
        const lastProd = lastItem?.product_data || lastItem?.product;
        // Kiểm tra lastProd hợp lệ
        if (!lastProd || (typeof lastProd !== 'object')) return;

        const categoryId = await productApi.getCategoryIdFromProduct(lastProd);
        if (!categoryId) return;
        const allProducts = await productApi.getAllProducts();
        const related = allProducts.filter((p) => {
          const prodCatId = p.category?.id || p.category;
          return prodCatId === categoryId && !cartItems.some(ci => (ci.product_data?.id || ci.product?.id) === p.id);
        });
        setRelatedProducts(related.slice(0, 4));
      } catch (err) { console.error(err); }
    };
    loadRelated();
  }, [cartItems]);

  // --- 2. CALCULATIONS ---

  // Logic Checkbox
  const allChecked = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const anyChecked = cartItems.some((item) => item.selected);

  const handleCheckAll = (e) => {
    if (e.target.checked) selectAllItems();
    else deselectAllItems();
  };

  const handleCheckItem = (itemId) => {
    toggleItem(itemId);
  };

  // Group Items
  const groupedItems = cartItems.reduce((acc, item) => {
    const pData = item.product_data || {};
    const pSource = typeof item.product === 'object' ? item.product : {};
    
    // Logic lấy storeId ưu tiên
    let storeId = 
        pData.store?.id || 
        (typeof pData.store !== 'object' ? pData.store : null) || 
        pSource.store?.id || 
        (typeof pSource.store !== 'object' ? pSource.store : null) || 
        "store-less";

    if (!acc[storeId]) acc[storeId] = { items: [] };
    acc[storeId].items.push(item);
    return acc;
  }, {});

  // Tính tiền & Voucher (SỬ DỤNG HÀM getFinalPrice)
  const selectedItemsData = cartItems.filter((item) => item.selected);

  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const price = getFinalPrice(item); // [SỬA] Dùng hàm lấy giá chuẩn
    const quantity = Number(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  const shopDiscount = useMemo(() => {
    if (selectedTotal === 0 || userVouchers.length === 0) return 0;
    const now = new Date();

    const validVouchers = userVouchers.filter(uv => {
      const v = uv.voucher;
      if (!v || uv.is_used) return false;
      if (v.discount_type === 'freeship' || (v.freeship_amount && v.freeship_amount > 0)) return false;
      if (v.start_at && new Date(v.start_at) > now) return false;
      if (v.end_at && new Date(v.end_at) < now) return false;
      if (v.min_order_value && selectedTotal < Number(v.min_order_value)) return false;
      return true;
    });

    let maxDisc = 0;
    validVouchers.forEach(uv => {
      const v = uv.voucher;
      let val = 0;
      if (v.discount_type === 'amount') val = Number(v.discount_amount);
      else if (v.discount_type === 'percent') {
        val = (selectedTotal * Number(v.discount_percent)) / 100;
        if (v.max_discount_amount) val = Math.min(val, Number(v.max_discount_amount));
      }
      if (val > maxDisc) maxDisc = val;
    });
    return maxDisc;
  }, [selectedTotal, userVouchers]);

  const finalTotal = Math.max(0, selectedTotal - shopDiscount);

  // --- 3. RENDER CONTENT ---

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <Empty
            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
            imageStyle={{ height: 160 }}
            description={<Title level={4} style={{ color: '#888' }}>Giỏ hàng trống</Title>}
          >
            <Button type="primary" size="large" onClick={() => navigate("/")} style={{ background: '#00b96b' }}>
              Tiếp tục mua sắm
            </Button>
          </Empty>
        </div>
      </Layout>
    );
  }

  const popoverContent = (
    <div style={{ minWidth: 260 }}>
      <div className="summary-row"><span>Tạm tính:</span><span>{formatVND(selectedTotal)}</span></div>
      <div className="summary-row"><span>Phí vận chuyển:</span><span style={{ fontSize: 12, color: '#888' }}>Tính ở bước thanh toán</span></div>
      {shopDiscount > 0 && <div className="summary-row"><span>Giảm giá Shop:</span><span style={{ color: '#52c41a' }}>-{formatVND(shopDiscount)}</span></div>}
      <Divider style={{ margin: "8px 0" }} />
      <div className="summary-row"><strong>Thanh toán:</strong><strong style={{ color: '#ff4d4f' }}>{formatVND(finalTotal)}</strong></div>
    </div>
  );

  return (
    <Layout>
      <div className="cart-layout">
        <div className="container" style={{ padding: '24px 12px' }}>
          {/* Header Trang */}
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>Giỏ hàng ({cartItems.length})</Title>
            <Button
              danger
              type="text"
              icon={<Trash2 size={16} />}
              onClick={() => setShowClearConfirm(true)}
            >
              Xóa tất cả
            </Button>
          </div>

          <Row gutter={[24, 24]}>
            {/* === CỘT TRÁI === */}
            <Col xs={24} lg={16} className="cart-left">
              <Card className="card-elevated" style={{ marginBottom: 16, padding: '12px 24px' }} bodyStyle={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Checkbox
                    checked={allChecked}
                    indeterminate={anyChecked && !allChecked}
                    onChange={handleCheckAll}
                  >
                    Chọn tất cả ({cartItems.length} sản phẩm)
                  </Checkbox>
                  {anyChecked && (
                    <Button type="text" danger onClick={deselectAllItems}>
                      Bỏ chọn tất cả
                    </Button>
                  )}
                </div>
              </Card>

              {Object.entries(groupedItems).map(([storeId, { items }]) => {
                const sellerInfo = sellerInfos[storeId] || {};
                const displayName = sellerInfo.store_name || items[0]?.product_data?.store_name || "Cửa hàng";
                const logoUrl = sellerInfo.image;

                return (
                  <Card key={storeId} className="store-group card-elevated" style={{ marginBottom: 16 }}>
                    {/* Store Header */}
                    <div className="store-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }} onClick={() => navigate(`/store/${storeId}`)}>
                      <Avatar shape="square" size={32} src={logoUrl} icon={<Store size={18} />} />
                      <span style={{ marginLeft: 12, fontWeight: 600, fontSize: 16 }}>{displayName}</span>
                      <ArrowRight size={16} color="#999" style={{ marginLeft: 8 }} />
                    </div>

                    <Divider style={{ margin: "12px 0" }} />

                    {/* List Items */}
                    {items.map((item) => {
                      const prod = item.product_data || (typeof item.product === 'object' ? item.product : {}) || {};
                      
                      // [SỬA] Dùng hàm lấy giá chuẩn để hiển thị
                      const unitPrice = getFinalPrice(item);

                      const itemId = getItemProductId(item);
                      const stableKey = item.id || item.product;

                      return (
                        <div key={stableKey} className="cart-item-row" style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ paddingRight: 12, display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                              checked={item.selected || false}
                              onChange={() => handleCheckItem(itemId)}
                            />
                          </div>

                          <div style={{ width: 80, height: 80, flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate(`/products/${prod.id}`)}>
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                            ) : (
                              <NoImage width="100%" height={80} text="No Img" />
                            )}
                          </div>

                          <div style={{ flex: 1, paddingLeft: 12 }}>
                            <div
                              style={{ fontWeight: 500, marginBottom: 4, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                              onClick={() => navigate(`/products/${prod.id}`)}
                            >
                              {prod.name || "Sản phẩm"}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                              <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                                {unitPrice > 0
                                  ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(unitPrice)
                                  : "Liên hệ"}
                              </div>
                              <QuantityInput item={item} itemId={itemId} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                );
              })}

              {/* Related Products */}
              {relatedProducts && relatedProducts.length > 0 && (
                <div style={{ marginTop: 30 }}>
                  <Title level={4}>Có thể bạn cũng thích</Title>
                  <Row gutter={[16, 16]}>
                    {relatedProducts.map(p => (
                      <Col xs={12} sm={8} md={6} key={p.id}>
                        <Card
                          hoverable
                          cover={<img alt={p.name} src={p.image || 'https://via.placeholder.com/150'} style={{ height: 150, objectFit: 'cover' }} />}
                          onClick={() => navigate(`/products/${p.id}`)}
                          bodyStyle={{ padding: 12 }}
                        >
                          <Card.Meta
                            title={<span style={{ fontSize: 14 }}>{p.name}</span>}
                            description={<span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{formatVND(p.price)}</span>}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Col>

            {/* === CỘT PHẢI: SUMMARY === */}
            <Col xs={24} lg={8} className="cart-right">
              <Card className="summary-card card-elevated sticky-summary">
                <div className="summary-top">
                  <Title level={4}>Tóm tắt đơn hàng</Title>
                  <Text type="secondary">Chỉ thanh toán các sản phẩm đã chọn</Text>
                </div>

                <Divider />

                <div className="summary-lines" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Số sản phẩm đã chọn</Text>
                    <Text>{selectedItemsData?.length || 0}</Text>
                  </div>
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Tạm tính</Text>
                    <Text>{formatVND(selectedTotal)}</Text>
                  </div>
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Giảm giá Shop</Text>
                    <Text style={{ color: shopDiscount > 0 ? '#52c41a' : '#888' }}>
                      {shopDiscount > 0 ? `-${formatVND(shopDiscount)}` : '0đ'}
                    </Text>
                  </div>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div className="summary-row total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Text strong>Tổng cộng</Text>
                  <div style={{ textAlign: 'right' }}>
                    <div className="total-price" style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 700 }}>
                      {formatVND(finalTotal)}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>(Đã bao gồm VAT)</Text>
                  </div>
                </div>

                <div className="summary-actions" style={{ marginTop: 16 }}>
                  <Popover content={popoverContent} placement="bottom">
                    <Button type="text" block>Xem chi tiết tính toán</Button>
                  </Popover>
                </div>

                <Button
                  block
                  type="primary"
                  size="large"
                  style={{ marginTop: 16, height: 45, fontSize: 16, fontWeight: 600 }}
                  disabled={selectedItemsData.length === 0}
                  onClick={() => navigate("/checkout")}
                  className="btn-checkout"
                >
                  THANH TOÁN NGAY ({intcomma(finalTotal)})
                </Button>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Mobile Sticky Bottom Bar */}
        <div className="mobile-bottom-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Checkbox checked={allChecked} onChange={handleCheckAll} />
            <Text>Tất cả</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="mobile-total-info" style={{ marginRight: 12, textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Tổng thanh toán</Text>
              <span className="mobile-total-price" style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 16 }}>{formatVND(finalTotal)}</span>
              {shopDiscount > 0 && <div style={{ fontSize: 10, color: '#52c41a' }}>Tiết kiệm: {formatVND(shopDiscount)}</div>}
            </div>
            <Button
              type="primary"
              style={{ background: '#00b96b', fontWeight: 600, height: 40 }}
              onClick={() => navigate("/checkout")}
              disabled={selectedItemsData.length === 0}
            >
              Mua hàng ({selectedItemsData.length})
            </Button>
          </div>
        </div>

        {/* --- MODALS --- */}
        <Modal
          open={showClearConfirm}
          onCancel={() => setShowClearConfirm(false)}
          onOk={async () => {
            await clearCart();
            setShowClearConfirm(false);
          }}
          title="Xóa tất cả sản phẩm"
          okText="Xóa tất cả"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          centered
        >
          Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ?
        </Modal>

        <Modal
          title={`Voucher cho shop ${voucherModal.storeName}`}
          open={voucherModal.visible}
          onCancel={() => setVoucherModal({ visible: false, storeId: null, storeName: "" })}
          footer={[<Button key="back" onClick={() => setVoucherModal({ visible: false, storeId: null, storeName: "" })}>Đóng</Button>]}
        >
          <p>Chức năng voucher đang được phát triển.</p>
        </Modal>

      </div>
    </Layout>
  );
}

export default CartPage;