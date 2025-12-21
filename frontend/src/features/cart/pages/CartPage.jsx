// src/features/cart/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useCart, getItemProductId } from "../services/CartContext";
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
  Card
} from "antd";
import { Store, ArrowRight, Trash2 } from "lucide-react"; // Dùng icon Lucide cho đẹp
import { useNavigate } from "react-router-dom";
import { productApi } from "../../products/services/productApi";
import { formatVND } from "../../stores/components/StoreDetail/utils/utils";
import QuantityInput from "./QuantityInput";
import { getSellerDetail } from "../../sellers/services/sellerService";
import NoImage from "../../../components/shared/NoImage";
import Layout from "../../../layout/LayoutDefault";
import "../styles/CartPage.css"; // Import file CSS mới

const { Text, Title } = Typography;

function CartPage() {
  const { cartItems, clearCart, selectAllItems, deselectAllItems, toggleItem } = useCart();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sellerInfos, setSellerInfos] = useState({});
  const navigate = useNavigate();

  // --- LOGIC (Giữ nguyên) ---
  useEffect(() => {
    const loadSellerInfos = async () => {
      const storeIds = new Set();
      cartItems.forEach((item) => {
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
            newSellerInfos[storeId] = { store_name: "Cửa hàng", image: null };
          }
        }
      }
      setSellerInfos(newSellerInfos);
    };
    if (cartItems.length > 0) loadSellerInfos();
  }, [cartItems]);

  useEffect(() => {
    const loadRelatedOnAdd = async () => {
      try {
        if (!cartItems || cartItems.length === 0) return;
        const lastItem = cartItems[cartItems.length - 1];
        const lastProd = lastItem?.product_data || lastItem?.product;
        if (!lastProd) return;
        const categoryId = await productApi.getCategoryIdFromProduct(lastProd);
        if (!categoryId) return;
        const allProducts = await productApi.getAllProducts();
        const related = allProducts.filter((p) => {
          const prodCatId = p.category?.id || p.category;
          return prodCatId === categoryId;
        });
        const filtered = related.filter(
          (p) => !cartItems.some((item) => (item.product_data?.id || item.product?.id) === p.id)
        );
        setRelatedProducts(filtered.slice(0, 4)); // Lấy 4 sp thôi cho đẹp grid
      } catch (err) { console.error(err); }
    };
    loadRelatedOnAdd();
  }, [cartItems]);

  // --- CALCULATION ---
  const allChecked = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const handleCheckAll = (e) => e.target.checked ? selectAllItems() : deselectAllItems();
  const selectedItemsData = cartItems.filter((item) => item.selected);
  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const prod = item.product_data || item.product || {};
    return sum + (Number(prod.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  const groupedItems = cartItems.reduce((acc, item) => {
    const storeId = item.product_data?.store?.id || item.product?.store?.id || "store-less";
    if (!acc[storeId]) acc[storeId] = { items: [] };
    acc[storeId].items.push(item);
    return acc;
  }, {});

  // --- RENDER ---
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
                icon={<Trash2 size={16}/>} 
                onClick={() => Modal.confirm({
                    title: 'Xóa tất cả',
                    content: 'Bạn muốn làm sạch giỏ hàng?',
                    okText: 'Xóa hết',
                    okType: 'danger',
                    onOk: clearCart
                })}
            >
                Xóa tất cả
            </Button>
          </div>

          <Row gutter={24}>
            {/* LEFT: Sản phẩm */}
            <Col xs={24} lg={16}>
              {/* Header List (Desktop only) */}
              <div className="cart-card" style={{ padding: '12px 16px', display: window.innerWidth < 992 ? 'none' : 'block' }}>
                <Row align="middle">
                  <Col span={1}><Checkbox checked={allChecked} onChange={handleCheckAll} /></Col>
                  <Col span={9}><Text type="secondary">Sản phẩm</Text></Col>
                  <Col span={4} style={{ textAlign: 'right' }}><Text type="secondary">Đơn giá</Text></Col>
                  <Col span={6} style={{ textAlign: 'center' }}><Text type="secondary">Số lượng</Text></Col>
                  <Col span={4} style={{ textAlign: 'right' }}><Text type="secondary">Thành tiền</Text></Col>
                </Row>
              </div>

              {/* Loop Stores */}
              {Object.entries(groupedItems).map(([storeId, { items }]) => {
                const sellerInfo = sellerInfos[storeId] || {};
                const displayName = sellerInfo.store_name || "Cửa hàng";
                const logoUrl = sellerInfo.image;

                return (
                  <div key={storeId} className="cart-card">
                    {/* Store Header */}
                    <div className="store-header">
                      <div className="store-link" onClick={() => navigate(`/store/${storeId}`)}>
                        <Avatar shape="square" size={32} src={logoUrl} icon={<Store size={18} />} />
                        <span className="store-name">{displayName}</span>
                        <ArrowRight size={16} color="#999" />
                      </div>
                    </div>

                    {/* Items List */}
                    <div>
                      {items.map((item) => {
                        const prod = item.product_data || item.product || {};
                        const itemId = getItemProductId(item);
                        const stableKey = item.id || item.product;

                        return (
                          <div key={stableKey} className="cart-item">
                            {/* Checkbox */}
                            <div className="item-checkbox">
                              <Checkbox 
                                checked={item.selected || false} 
                                onChange={() => toggleItem(itemId)} 
                              />
                            </div>

                            {/* Product Info */}
                            <div className="item-info-group">
                              <div className="item-img-wrapper" onClick={() => navigate(`/products/${prod.id}`)}>
                                {prod.image ? <img src={prod.image} alt={prod.name} /> : <NoImage text="No Img" />}
                              </div>
                              
                              <div className="item-details">
                                <div 
                                    className="item-name" 
                                    title={prod.name}
                                    onClick={() => navigate(`/products/${prod.id}`)}
                                >
                                    {prod.name}
                                </div>
                                
                                {/* Mobile Price & Qty */}
                                <div className="item-actions-mobile">
                                   <Text strong style={{ color: '#ff4d4f' }}>{formatVND(prod.price)}</Text>
                                   <QuantityInput item={item} itemId={itemId} />
                                </div>
                              </div>

                              {/* Desktop Columns */}
                              <div className="desktop-cols">
                                <div className="col-price" style={{paddingRight: 80}}>{formatVND(prod.price)}</div>
                                <div className="col-qty"><QuantityInput item={item} itemId={itemId} /></div>
                                <div className="col-total">
                                    {formatVND((Number(prod.price) || 0) * (Number(item.quantity) || 0))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Related Products Grid */}
              {relatedProducts.length > 0 && (
                <div style={{ marginTop: 30 }}>
                  <Title level={4}>Có thể bạn cũng thích</Title>
                  <Row gutter={[16, 16]}>
                    {relatedProducts.map(p => (
                        <Col xs={12} sm={8} md={6} key={p.id}>
                            <Card 
                                hoverable 
                                cover={<img alt={p.name} src={p.image || 'https://via.placeholder.com/150'} style={{ height: 150, objectFit: 'cover'}} />}
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

            {/* RIGHT: Order Summary */}
            <Col xs={24} lg={8}>
              <div className="summary-wrapper">
                <div className="cart-card" style={{ padding: 24 }}>
                   <Title level={4} style={{ marginTop: 0 }}>Thanh toán</Title>
                   
                   <div className="summary-row">
                      <span>Tạm tính ({selectedItemsData.length} sản phẩm)</span>
                      <span>{formatVND(selectedTotal)}</span>
                   </div>
                   <div className="summary-row">
                      <span>Khuyến mãi</span>
                      <span>0₫</span>
                   </div>
                   
                   <div className="summary-total">
                      <span style={{ fontSize: 16 }}>Tổng cộng</span>
                      <div style={{ textAlign: 'right' }}>
                          <div className="total-price">{formatVND(selectedTotal)}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>(Đã bao gồm VAT nếu có)</Text>
                      </div>
                   </div>

                   <Button 
                      type="primary" 
                      block 
                      className="btn-checkout"
                      style={{ marginTop: 24 }}
                      onClick={() => navigate("/checkout")}
                      disabled={selectedItemsData.length === 0}
                   >
                      MUA HÀNG ({selectedItemsData.length})
                   </Button>
                </div>
              </div>
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
              <div className="mobile-total-info">
                 <Text type="secondary" style={{ fontSize: 12 }}>Tổng thanh toán</Text>
                 <span className="mobile-total-price">{formatVND(selectedTotal)}</span>
              </div>
              <Button 
                  type="primary" 
                  style={{ background: '#00b96b', fontWeight: 600 }}
                  onClick={() => navigate("/checkout")}
                  disabled={selectedItemsData.length === 0}
              >
                  Mua hàng ({selectedItemsData.length})
              </Button>
           </div>
        </div>
      </div>
    </Layout>
  );
}

export default CartPage;