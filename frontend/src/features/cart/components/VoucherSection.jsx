import React, { useState, useEffect, useMemo } from "react";
import { Button, Typography, Modal, Radio, Tabs, Tag, Badge, Empty, Space } from "antd";
import { FireOutlined, CarOutlined, GiftOutlined, CheckCircleFilled, RightOutlined } from "@ant-design/icons";
import { getMyVouchers } from "../../admin/services/promotionServices";

const { Text } = Typography;

// --- HELPER: Tính giá trị giảm giá ---
const calculateDiscountValue = (voucher, orderTotal, shippingFee) => {
  if (!voucher) return 0;
  const total = Number(orderTotal) || 0;
  const shipFee = Number(shippingFee) || 0;

  // 1. Voucher Freeship
  if (voucher.discount_type === 'freeship' || (voucher.freeship_amount && voucher.freeship_amount > 0)) {
      const maxFree = Number(voucher.freeship_amount);
      return Math.min(maxFree, shipFee); 
  }

  // 2. Voucher Phần trăm
  if (voucher.discount_type === 'percent') {
      let val = (total * Number(voucher.discount_percent)) / 100;
      if (voucher.max_discount_amount) {
          val = Math.min(val, Number(voucher.max_discount_amount));
      }
      return val;
  }

  // 3. Voucher Số tiền
  if (voucher.discount_type === 'amount') {
      return Number(voucher.discount_amount);
  }
  return 0;
};

// --- HELPER: Kiểm tra điều kiện áp dụng ---
const isVoucherApplicable = (v, total) => {
  if (!v) return false;
  const now = new Date();
  
  if (v.start_at && new Date(v.start_at) > now) return false;
  if (v.end_at && new Date(v.end_at) < now) return false;
  if (v.min_order_value && total < Number(v.min_order_value)) return false;

  return true;
};

const VoucherSection = ({ total, shippingFee = 0, onApply }) => {
  const [allVouchers, setAllVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedShopVoucher, setSelectedShopVoucher] = useState(null);
  const [selectedShipVoucher, setSelectedShipVoucher] = useState(null);

  // --- 1. FETCH DATA ---
  // Gọi mỗi khi Component mount để lấy danh sách mới nhất
  useEffect(() => {
    const loadVouchers = async () => {
      setLoading(true);
      try {
        const res = await getMyVouchers();
        // Đảm bảo dữ liệu luôn là mảng
        setAllVouchers(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load vouchers", err);
      } finally {
        setLoading(false);
      }
    };
    loadVouchers();
  }, [total]); // Thêm total vào dependency để reload khi đơn hàng thay đổi (tùy chọn)

  // --- 2. GỘP VOUCHER & PHÂN LOẠI (LOGIC QUAN TRỌNG) ---
  const { shopVouchers, shipVouchers } = useMemo(() => {
      const shopMap = {};
      const shipMap = {};

      if (!allVouchers || !allVouchers.length) return { shopVouchers: [], shipVouchers: [] };

      allVouchers.forEach(uv => {
          // Lọc bỏ voucher đã dùng (theo cờ is_used từ backend)
          if (uv.is_used) return;

          const v = uv.voucher;
          if (!v) return;

          // Tính số lượng còn lại của dòng này
          const qty = (uv.quantity || 1); 
          const used = (uv.used_count || 0);
          const remaining = qty - used;

          // [FIX] Nếu hết lượt dùng thì bỏ qua luôn (ẩn khỏi danh sách)
          if (remaining <= 0) return;

          const isShip = v.discount_type === 'freeship' || (v.freeship_amount && v.freeship_amount > 0);
          const targetMap = isShip ? shipMap : shopMap;

          // Gộp theo Mã Voucher
          if (!targetMap[v.code]) {
              // Tạo bản ghi đại diện cho nhóm
              targetMap[v.code] = { 
                  ...uv, 
                  total_available: 0 // Biến đếm tổng số lượng
              };
          }
          // Cộng dồn số lượng
          targetMap[v.code].total_available += remaining;
      });

      return {
          shopVouchers: Object.values(shopMap),
          shipVouchers: Object.values(shipMap)
      };
  }, [allVouchers]);

  // --- 3. SMART AUTO-SELECT ---
  useEffect(() => {
    // Logic: Chọn voucher giảm nhiều nhất trong số các voucher hợp lệ
    
    const validShop = shopVouchers
        .filter(uv => isVoucherApplicable(uv.voucher, total))
        .sort((a, b) => calculateDiscountValue(b.voucher, total, shippingFee) - calculateDiscountValue(a.voucher, total, shippingFee));
    
    const validShip = shipVouchers
        .filter(uv => isVoucherApplicable(uv.voucher, total))
        .sort((a, b) => calculateDiscountValue(b.voucher, total, shippingFee) - calculateDiscountValue(a.voucher, total, shippingFee));

    const bestShop = validShop.length > 0 ? validShop[0] : null;
    const bestShip = validShip.length > 0 ? validShip[0] : null;

    setSelectedShopVoucher(bestShop);
    setSelectedShipVoucher(bestShip);
    
    // Gửi ra ngoài ngay lập tức
    if (bestShop || bestShip) {
        pushDataToParent(bestShop, bestShip);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopVouchers, shipVouchers, total, shippingFee]); 

  // --- 4. GỬI DỮ LIỆU ---
  const pushDataToParent = (shopV, shipV) => {
      const shopDiscount = calculateDiscountValue(shopV?.voucher, total, shippingFee);
      const shipDiscount = calculateDiscountValue(shipV?.voucher, total, shippingFee);
      
      onApply({
          shopVoucher: shopV,
          shipVoucher: shipV,
          shopDiscount: shopDiscount,
          shipDiscount: shipDiscount,
          totalDiscount: shopDiscount + shipDiscount
      });
  };

  // --- 5. RENDER ITEM ---
  const renderVoucherItem = (uv, type) => {
      const v = uv.voucher;
      const applicable = isVoucherApplicable(v, total);
      const discountVal = calculateDiscountValue(v, total, shippingFee);
      
      // So sánh theo ID (của đại diện nhóm) hoặc Code
      const isSelected = type === 'shop' 
          ? selectedShopVoucher?.id === uv.id 
          : selectedShipVoucher?.id === uv.id;

      const handleSelect = () => {
          if (!applicable) return;
          if (type === 'shop') {
              // Toggle: Nếu đang chọn thì bỏ chọn
              const newShop = isSelected ? null : uv;
              setSelectedShopVoucher(newShop);
              pushDataToParent(newShop, selectedShipVoucher);
          } else {
              const newShip = isSelected ? null : uv;
              setSelectedShipVoucher(newShip);
              pushDataToParent(selectedShopVoucher, newShip);
          }
      };

      return (
          <div 
            key={uv.id}
            onClick={handleSelect}
            style={{
                position: 'relative',
                padding: '12px',
                marginBottom: '12px',
                border: isSelected ? '1px solid #1677ff' : '1px solid #f0f0f0',
                borderRadius: '8px',
                background: applicable ? (isSelected ? '#f0f5ff' : '#fff') : '#fafafa',
                cursor: applicable ? 'pointer' : 'not-allowed',
                opacity: applicable ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 2px 8px rgba(22, 119, 255, 0.15)' : 'none'
            }}
          >
              {/* Badge Số lượng (Nằm góc phải trên) */}
              {uv.total_available > 1 && (
                  <div style={{
                      position: 'absolute', top: 0, right: 0, 
                      background: '#ff4d4f', color: '#fff', 
                      fontSize: '11px', fontWeight: 'bold', 
                      padding: '2px 8px', 
                      borderBottomLeftRadius: '8px', 
                      borderTopRightRadius: '8px',
                      zIndex: 1
                  }}>
                      x{uv.total_available}
                  </div>
              )}

              {/* Icon */}
              <div style={{ marginRight: 16 }}>
                  <div style={{ 
                      width: 48, height: 48, 
                      background: type === 'ship' ? '#e6f7ff' : '#fff7e6', 
                      color: type === 'ship' ? '#1890ff' : '#fa8c16',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '8px', fontSize: 24,
                      border: `1px solid ${type === 'ship' ? '#bae7ff' : '#ffe58f'}`
                  }}>
                      {type === 'ship' ? <CarOutlined /> : <FireOutlined />}
                  </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 15 }}>{v.code}</Text>
                      {type === 'ship' && <Tag color="blue" style={{fontSize: 10, lineHeight: '18px'}}>FREESHIP</Tag>}
                  </div>
                  
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>
                      {v.title || v.name}
                  </div>

                  {!applicable ? (
                      <Text type="danger" style={{ fontSize: 12 }}>
                          Chưa đủ điều kiện (Đơn từ {Number(v.min_order_value).toLocaleString()}đ)
                      </Text>
                  ) : (
                      <Text type="success" style={{ fontSize: 12 }}>
                          <CheckCircleFilled /> Giảm được: <strong>{discountVal.toLocaleString()}đ</strong>
                      </Text>
                  )}
              </div>

              {/* Radio */}
              <div style={{ paddingLeft: 12 }}>
                  <Radio checked={isSelected} disabled={!applicable} />
              </div>
          </div>
      );
  };

  const shopDiscountVal = calculateDiscountValue(selectedShopVoucher?.voucher, total, shippingFee);
  const shipDiscountVal = calculateDiscountValue(selectedShipVoucher?.voucher, total, shippingFee);

  return (
    <div style={{ marginTop: 20 }}>
        {/* THANH HIỂN THỊ TRẠNG THÁI */}
        <div 
            style={{ 
                padding: '12px 16px', 
                background: '#fff', 
                borderRadius: 8, 
                border: '1px solid #d9d9d9',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
            onClick={() => setIsModalOpen(true)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GiftOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
                <div>
                    <Text strong style={{ display: 'block', lineHeight: 1.2 }}>GreenFarm Voucher</Text>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {selectedShopVoucher || selectedShipVoucher ? (
                            <span style={{ color: '#237804' }}>
                                Đã chọn {selectedShopVoucher ? 1 : 0} voucher shop, {selectedShipVoucher ? 1 : 0} freeship
                            </span>
                        ) : (
                            "Chọn hoặc nhập mã"
                        )}
                    </div>
                </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(shopDiscountVal + shipDiscountVal) > 0 && (
                    <Tag color="volcano">-{ (shopDiscountVal + shipDiscountVal).toLocaleString() }đ</Tag>
                )}
                <RightOutlined style={{ color: '#ccc', fontSize: 12 }} />
            </div>
        </div>

        {/* --- MODAL --- */}
        <Modal
            title={<div style={{textAlign: 'center', fontWeight: 700, fontSize: 16}}>Chọn GreenFarm Voucher</div>}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={[
                <Button key="ok" type="primary" size="large" block onClick={() => setIsModalOpen(false)} style={{height: 45, borderRadius: 8}}>
                    Đồng ý
                </Button>
            ]}
            bodyStyle={{ padding: 0 }}
            width={500}
            centered
        >
            <div style={{ background: '#fffbe6', padding: '10px 16px', borderBottom: '1px solid #ffe58f' }}>
                <Text type="warning" style={{ fontSize: 13 }}>
                    <GiftOutlined /> Mẹo: Bạn có thể chọn 1 Voucher Shop và 1 Voucher Vận chuyển
                </Text>
            </div>
            
            <Tabs 
                defaultActiveKey="1" 
                centered
                size="large"
                tabBarStyle={{ marginBottom: 0, background: '#fff', borderBottom: '1px solid #f0f0f0' }}
                items={[
                    {
                        key: '1',
                        label: (
                            <span style={{padding: '0 10px'}}>
                                Mã giảm giá {shopVouchers.length > 0 && <Badge count={shopVouchers.length} offset={[8, -2]} size="small" color="#fa8c16" />}
                            </span>
                        ),
                        children: (
                            <div style={{ height: 400, overflowY: 'auto', padding: 16, background: '#f5f5f5' }}>
                                {shopVouchers.length > 0 ? (
                                    shopVouchers.map(uv => renderVoucherItem(uv, 'shop'))
                                ) : (
                                    <Empty description="Không có mã giảm giá nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}
                            </div>
                        ),
                    },
                    {
                        key: '2',
                        label: (
                            <span style={{padding: '0 10px'}}>
                                Vận chuyển {shipVouchers.length > 0 && <Badge count={shipVouchers.length} offset={[8, -2]} size="small" color="#1890ff" />}
                            </span>
                        ),
                        children: (
                            <div style={{ height: 400, overflowY: 'auto', padding: 16, background: '#f5f5f5' }}>
                                {shipVouchers.length > 0 ? (
                                    shipVouchers.map(uv => renderVoucherItem(uv, 'ship'))
                                ) : (
                                    <Empty description="Không có mã freeship nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}
                            </div>
                        ),
                    },
                ]}
            />
            
            <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">Đã chọn:</Text>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13 }}>
                        Giảm giá: <span style={{ color: '#fa8c16', fontWeight: 600 }}>-{shopDiscountVal.toLocaleString()}đ</span>
                    </div>
                    <div style={{ fontSize: 13 }}>
                        Vận chuyển: <span style={{ color: '#1890ff', fontWeight: 600 }}>-{shipDiscountVal.toLocaleString()}đ</span>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default VoucherSection;