import React, { useState, useEffect, useMemo } from "react";
import { useCart, getItemProductId } from "../services/CartContext";
import {
  Card,
  Button,
  Modal,
  Checkbox,
  Popover,
  Row,
  Col,
  Avatar,
  Typography,
  Divider,
  Space,
  Tag
} from "antd";
import { Store, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../products/services/productApi";
import { formatVND } from "../../stores/components/StoreDetail/utils/utils";
import QuantityInput from "./QuantityInput";
import "../styles/CartPage.css";
import Layout from "../../../Layout/LayoutDefault";
import { getSellerDetail } from "../../sellers/services/sellerService";
import { getMyVouchers } from "../../admin/services/promotionServices";
import NoImage from "../../../components/shared/NoImage";

const { Text, Title } = Typography;

function CartPage() {
  const { cartItems, clearCart, selectAllItems, deselectAllItems, toggleItem } = useCart();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sellerInfos, setSellerInfos] = useState({});
  const [userVouchers, setUserVouchers] = useState([]); 

  const [voucherModal, setVoucherModal] = useState({
    visible: false,
    storeId: null,
    storeName: "",
  });

  const navigate = useNavigate();

  // --- 1. Load Voucher ---
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await getMyVouchers();
        setUserVouchers(Array.isArray(res) ? res : []);
      } catch (err) {
        setUserVouchers([]);
      }
    };
    fetchVouchers();
  }, []);

  // --- 2. Load Seller Info ---
  useEffect(() => {
    if (!cartItems.length) return;
    const loadSellerInfos = async () => {
      const storeIds = new Set();
      cartItems.forEach((item) => {
        const storeId = item.product_data?.store?.id || item.product?.store?.id;
        if (storeId) storeIds.add(storeId);
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
  }, [cartItems, sellerInfos]);

  // --- 3. Load Related Products ---
  useEffect(() => {
    const loadRelated = async () => {
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
          return prodCatId === categoryId && !cartItems.some(ci => (ci.product_data?.id || ci.product?.id) === p.id);
        });
        setRelatedProducts(related.slice(0, 8));
      } catch (err) { console.error(err); }
    };
    loadRelated();
  }, [cartItems]);

  // --- LOGIC CHECKBOX ---
  const allChecked = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const anyChecked = cartItems.some((item) => item.selected); // Kiểm tra có món nào đang được chọn không

  const handleCheckAll = (e) => {
    if (e.target.checked) selectAllItems();
    else deselectAllItems();
  };

  const handleCheckItem = (itemId) => {
    toggleItem(itemId);
  };

  // Tính toán tiền
  const selectedItemsData = cartItems.filter((item) => item.selected);
  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const prod = item.product_data || item.product || {};
    return sum + (Number(prod.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  // Logic Voucher
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

  const groupedItems = cartItems.reduce((acc, item) => {
    const storeId = item.product_data?.store?.id || item.product?.store?.id || "store-less";
    if (!acc[storeId]) {
      acc[storeId] = { items: [] };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="cart-empty text-center my-5">
          <Title level={3}>Giỏ hàng của bạn đang trống</Title>
          <Text type="secondary">Hãy thêm món ngon vào giỏ và quay lại sau nhé.</Text>
          <div style={{ marginTop: 20 }}>
            <Button type="primary" icon={<Store />} onClick={() => navigate("/")}>
              Đi tới chợ
            </Button>
          </div>
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
      <div className="cart-page container">
        <Row gutter={[24, 24]}>
          {/* CỘT TRÁI: LIST SẢN PHẨM */}
          <Col xs={24} lg={16} className="cart-left">
            
            {/* [MỚI] THANH CÔNG CỤ CHỌN TẤT CẢ / BỎ CHỌN */}
            <Card className="card-elevated" style={{ marginBottom: 16, padding: '12px 24px' }} bodyStyle={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Checkbox 
                        checked={allChecked} 
                        indeterminate={anyChecked && !allChecked} // Hiện dấu gạch ngang nếu chỉ chọn 1 vài món
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
              const displayName = sellerInfo.store_name || "Cửa hàng";
              const logoUrl = sellerInfo.image || null;

              return (
                <Card key={storeId} className="store-group card-elevated">
                  <div className="store-header">
                    <div className="store-meta">
                      <div className="store-logo-wrapper clickable" onClick={() => navigate(`/store/${storeId}`)}>
                        {logoUrl ? <Avatar src={logoUrl} size={56} /> : <Avatar size={56} icon={<Store />} />}
                      </div>
                      <div className="store-info">
                        <Title level={5} className="store-name clickable" onClick={() => navigate(`/store/${storeId}`)}>
                          {displayName}
                        </Title>
                      </div>
                    </div>
                  </div>

                  <Divider style={{ margin: "12px 0" }} />

                  <div className="cart-item-header grid-header">
                    <span className="col-checkbox" />
                    <span className="col-name">Sản phẩm</span>
                    <span className="col-price">Đơn giá</span>
                    <span className="col-quantity">Số lượng</span>
                    <span className="col-total">Thành tiền</span>
                  </div>

                  {items.map((item) => {
                    const prod = item.product_data || item.product || {};
                    const stableKey = item.id || item.product;
                    const itemId = getItemProductId(item);
                    return (
                      <div key={stableKey} className="cart-item grid-row">
                        <div className="col-checkbox">
                          <Checkbox
                            checked={item.selected || false}
                            onChange={() => handleCheckItem(itemId)}
                          />
                        </div>

                        <div className="col-name item-main">
                          <div className="item-thumb clickable" onClick={() => navigate(`/products/${prod.id}`)}>
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="item-img" />
                            ) : (
                              <div className="item-img no-image"><NoImage width="100%" height={90} text="No Img" /></div>
                            )}
                          </div>
                          <div className="item-meta">
                            <Text className="item-name clickable" onClick={() => navigate(`/products/${prod.id}`)}>
                              {prod.name || "---"}
                            </Text>
                          </div>
                        </div>

                        <div className="col-price">
                          <Text style={{ fontWeight: 400 }}>{formatVND(prod.price)}</Text>
                        </div>

                        <div className="col-quantity">
                          <QuantityInput item={item} itemId={itemId} />
                        </div>

                        <div className="col-total">
                          <Text style={{ color: '#4caf50', fontWeight: 400 }}>
                            {formatVND(Number(prod.price) * Number(item.quantity))}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}

            {/* Sản phẩm liên quan */}
            {relatedProducts && relatedProducts.length > 0 && (
              <Card className="related-card">
                <Title level={5}>Sản phẩm gợi ý cho bạn</Title>
                <div className="related-list">
                  {relatedProducts.map((p) => (
                    <div key={p.id} className="related-item clickable" onClick={() => navigate(`/products/${p.id}`)}>
                      <div className="related-thumb">
                        {p.image ? <img src={p.image} alt={p.name} /> : <div className="related-no-image">No image</div>}
                      </div>
                      <div className="related-info">
                        <Text ellipsis style={{ maxWidth: 140 }}>{p.name}</Text>
                        <Text strong>{formatVND(p.price)}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Col>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <Col xs={24} lg={8} className="cart-right">
            <Card className="summary-card card-elevated sticky-summary">
              <div className="summary-top">
                <Title level={4}>Tóm tắt đơn hàng</Title>
                <Text type="secondary">Chỉ thanh toán các sản phẩm đã chọn</Text>
              </div>

              <Divider />

              <div className="summary-lines" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="summary-row">
                  <Text type="secondary">Số sản phẩm đã chọn</Text>
                  <Text>{selectedItemsData?.length || 0}</Text>
                </div>
                <div className="summary-row">
                  <Text type="secondary">Tạm tính</Text>
                  <Text>{formatVND(selectedTotal)}</Text>
                </div>
                <div className="summary-row">
                  <Text type="secondary">Phí vận chuyển</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>Tính ở bước thanh toán</Text>
                </div>
                <div className="summary-row">
                  <Text type="secondary">Giảm giá Shop</Text>
                  <Text style={{ color: shopDiscount > 0 ? '#52c41a' : '#888' }}>
                    {shopDiscount > 0 ? `-${formatVND(shopDiscount)}` : '0đ'}
                  </Text>
                </div>
                <div className="summary-row">
                  <Text type="secondary">Hỗ trợ phí ship</Text>
                  <Text style={{ color: '#1677ff' }}>-0đ</Text> 
                </div>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <div className="summary-row total" style={{ alignItems: 'flex-end' }}>
                <Text strong>Tổng cộng</Text>
                <div style={{ textAlign: 'right' }}>
                  <div className="total-price" style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 700 }}>
                    {formatVND(finalTotal)}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>(Đã bao gồm VAT)</Text>
                </div>
              </div>

              {shopDiscount > 0 && (
                 <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Tag color="success" icon={<Gift size={12} style={{marginRight: 4}}/>}>
                       Đã tự động áp dụng voucher tốt nhất
                    </Tag>
                 </div>
              )}

              <div className="summary-actions" style={{marginTop: 16}}>
                <Popover content={popoverContent} placement="topLeft">
                  <Button type="text" block>Xem chi tiết tính toán</Button>
                </Popover>
              </div>

              <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 8 }}>
                <Button
                  block
                  size="large"
                  style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", height: 45, fontSize: 16, fontWeight: 600 }}
                  disabled={selectedItemsData.length === 0}
                  onClick={() => navigate("/checkout")}
                >
                  Thanh toán ngay ({formatVND(finalTotal)})
                </Button>

                <Button
                  block
                  size="large"
                  onClick={() => setShowClearConfirm(true)}
                  style={{ backgroundColor: "#ff4d4f", color: "#fff", border: "none" }}
                >
                  Xóa tất cả
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <div className="cart-bottom-bar-mobile">
          <Checkbox checked={allChecked} onChange={handleCheckAll} />
          <div className="mobile-summary">
            <div>
              <Text style={{fontSize: 12}}>Tổng: </Text>
              <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>{formatVND(finalTotal)}</Text>
              {shopDiscount > 0 && <div style={{ fontSize: 10, color: '#52c41a' }}>Tiết kiệm: {formatVND(shopDiscount)}</div>}
            </div>
            <Button
              type="primary"
              disabled={selectedItemsData.length === 0}
              onClick={() => navigate("/checkout")}
              style={{ background: '#16a34a', border: 'none' }}
            >
              Thanh toán
            </Button>
          </div>
        </div>

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