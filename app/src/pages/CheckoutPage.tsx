import React, { useState, useMemo, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonNote,
  useIonRouter,
  IonLoading
} from '@ionic/react';
import { 
  locationOutline, 
  chevronForward, 
  cardOutline, 
  cashOutline, 
  ticketOutline,
  cubeOutline
} from 'ionicons/icons';

// 👇 1. Import Context (Quan trọng nhất)
import { useCart, CartItem } from '../context/CartContext';

// --- MÀU SẮC CHỦ ĐẠO ---
const PRIMARY_COLOR = '#2E7D32';

const CheckoutPage: React.FC = () => {
  const router = useIonRouter();
  
  // 👇 2. Lấy dữ liệu từ Context thay vì dùng Dummy Data
  const { cartItems } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  // 👇 3. Lọc ra các sản phẩm ĐƯỢC CHỌN (selected === true)
  // Sử dụng useMemo để không phải tính toán lại mỗi khi render nếu cartItems không đổi
  const checkoutItems = useMemo(() => {
    return cartItems.filter((item: CartItem) => item.selected);
  }, [cartItems]);

  // 👇 4. Tính toán tiền nong dynamic
  const totalGoods = useMemo(() => {
    return checkoutItems.reduce((acc, item) => {
        const price = item.product_data?.price || 0;
        return acc + (price * item.quantity);
    }, 0);
  }, [checkoutItems]);

  const shippingFee = 30000; // Có thể thay bằng API tính phí sau này
  const discount = 0; // Logic voucher sẽ phát triển sau
  const finalTotal = totalGoods + shippingFee - discount;

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // 👇 5. Route Guard: Nếu F5 hoặc vào trực tiếp mà ko có hàng -> Đá về Cart
  useEffect(() => {
    if (checkoutItems.length === 0) {
        // Dùng replace để user không bấm Back quay lại trang trắng này được
        router.push('/cart', 'back', 'replace'); 
    }
  }, [checkoutItems, router]);

  // Xử lý đặt hàng
  const handlePlaceOrder = async () => {
      setIsProcessing(true);
      // Giả lập gọi API
      setTimeout(() => {
          setIsProcessing(false);
          // TODO: Gọi API createOrder tại đây
          // Sau khi thành công:
          // 1. Clear cart (những món đã mua)
          // 2. Chuyển hướng trang Success
          alert('Đặt hàng thành công! (Demo)');
          router.push('/home', 'root');
      }, 1500);
  };

  // Nếu đang redirect thì không render gì cả để tránh nháy màn hình
  if (checkoutItems.length === 0) return null;

  return (
    <IonPage>
      {/* Loading khi bấm nút đặt hàng */}
      <IonLoading isOpen={isProcessing} message={'Đang xử lý đơn hàng...'} />

      {/* --- HEADER --- */}
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#fff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cart" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontWeight: 600, fontSize: '18px', color: '#333' }}>Thanh toán</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding-bottom" style={{ '--background': '#f4f6f8' }}>
        
        {/* --- 1. ĐỊA CHỈ NHẬN HÀNG --- */}
        <div style={{ 
          background: '#fff', 
          marginBottom: '10px', 
          padding: '16px',
          position: 'relative',
          backgroundImage: 'repeating-linear-gradient(45deg, #6fa6d6, #6fa6d6 33px, transparent 0, transparent 41px, #f18d9b 0, #f18d9b 74px, transparent 0, transparent 82px)',
          backgroundPosition: 'top left',
          backgroundSize: '100% 3px',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', color: PRIMARY_COLOR }}>
            <IonIcon icon={locationOutline} style={{ marginRight: '8px' }} />
            <span style={{ fontWeight: '600' }}>Địa chỉ nhận hàng</span>
          </div>
          <div style={{ paddingLeft: '24px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px', color: '#333' }}>
              Nguyễn Văn A | 0987.654.321
            </div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
              Số 123, Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ
            </div>
          </div>
          <IonIcon 
            icon={chevronForward} 
            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} 
          />
        </div>

        {/* --- 2. DANH SÁCH SẢN PHẨM (Dữ liệu thật từ Context) --- */}
        <div style={{ background: '#fff', marginBottom: '10px', padding: '16px 16px 0 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Sản phẩm</h4>
          
          {checkoutItems.map((item, index) => {
             // Safe check product data
             const product = item.product_data;
             if (!product) return null;
             
             return (
                <div key={index} style={{ display: 'flex', marginBottom: '16px' }}>
                  <img 
                    src={product.image || 'https://via.placeholder.com/150'} 
                    alt={product.name} 
                    style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', background: '#f9f9f9', border: '1px solid #eee' }} 
                  />
                  <div style={{ marginLeft: '12px', flex: 1 }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>
                      {product.name}
                    </div>
                    {product.unit && <div style={{fontSize: '11px', color: '#999', marginBottom: '4px'}}>Phân loại: {product.unit}</div>}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>x{item.quantity}</span>
                      <span style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>{formatPrice(product.price || 0)}</span>
                    </div>
                  </div>
                </div>
             );
          })}
        </div>

        {/* --- 3. PHƯƠNG THỨC VẬN CHUYỂN --- */}
        <div style={{ background: '#fff', marginBottom: '10px', padding: '0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <IonItem lines="none" detail={true} button>
            <IonIcon icon={cubeOutline} slot="start" color="medium" style={{ fontSize: '20px' }} />
            <IonLabel>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Phương thức vận chuyển</h3>
              <p style={{ color: PRIMARY_COLOR, fontSize: '13px', marginTop: '4px' }}>
                Giao Hàng Nhanh - {formatPrice(shippingFee)}
              </p>
              <p style={{ fontSize: '11px', color: '#888' }}>Nhận hàng vào 16 Th12 - 18 Th12</p>
            </IonLabel>
          </IonItem>
        </div>

        {/* --- 4. VOUCHER & THANH TOÁN --- */}
        <div style={{ background: '#fff', marginBottom: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <IonItem lines="full" detail={true} button>
            <IonIcon icon={ticketOutline} slot="start" color="warning" style={{ fontSize: '20px' }} />
            <IonLabel style={{ fontSize: '14px' }}>GreenFarm Voucher</IonLabel>
            <IonNote slot="end" style={{ fontSize: '13px', color: PRIMARY_COLOR }}>
                {discount > 0 ? `-${formatPrice(discount)}` : 'Chọn Voucher'}
            </IonNote>
          </IonItem>

          <div style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Phương thức thanh toán</h4>
            <IonRadioGroup value={paymentMethod} onIonChange={e => setPaymentMethod(e.detail.value)}>
              <div style={{ display: 'flex', gap: '10px' }}>
                 {/* COD */}
                <div 
                   onClick={() => setPaymentMethod('cod')}
                   style={{ 
                     flex: 1, border: `1px solid ${paymentMethod === 'cod' ? PRIMARY_COLOR : '#ddd'}`, 
                     borderRadius: '8px', padding: '10px', textAlign: 'center',
                     background: paymentMethod === 'cod' ? '#f1f8e9' : '#fff',
                     transition: 'all 0.2s'
                   }}
                >
                  <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: paymentMethod === 'cod' ? PRIMARY_COLOR : '#666' }} />
                  <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: paymentMethod === 'cod' ? 'bold' : 'normal', color: paymentMethod === 'cod' ? PRIMARY_COLOR : '#666' }}>Tiền mặt</div>
                  <IonRadio value="cod" style={{ display: 'none' }} />
                </div>

                {/* Banking */}
                <div 
                   onClick={() => setPaymentMethod('banking')}
                   style={{ 
                     flex: 1, border: `1px solid ${paymentMethod === 'banking' ? PRIMARY_COLOR : '#ddd'}`, 
                     borderRadius: '8px', padding: '10px', textAlign: 'center',
                     background: paymentMethod === 'banking' ? '#f1f8e9' : '#fff',
                     transition: 'all 0.2s'
                   }}
                >
                  <IonIcon icon={cardOutline} style={{ fontSize: '24px', color: paymentMethod === 'banking' ? PRIMARY_COLOR : '#666' }} />
                  <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: paymentMethod === 'banking' ? 'bold' : 'normal', color: paymentMethod === 'banking' ? PRIMARY_COLOR : '#666' }}>Chuyển khoản</div>
                  <IonRadio value="banking" style={{ display: 'none' }} />
                </div>
              </div>
            </IonRadioGroup>
          </div>
        </div>

        {/* --- 5. CHI TIẾT THANH TOÁN (Dynamic Math) --- */}
        <div style={{ background: '#fff', padding: '16px', paddingBottom: '100px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
           <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Chi tiết thanh toán</h4>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
             <span>Tổng tiền hàng</span>
             <span>{formatPrice(totalGoods)}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
             <span>Phí vận chuyển</span>
             <span>{formatPrice(shippingFee)}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
             <span>Giảm giá</span>
             <span>-{formatPrice(discount)}</span>
           </div>
           <div style={{ borderTop: '1px dashed #ddd', margin: '8px 0' }}></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>Tổng thanh toán</span>
             <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#D32F2F' }}>{formatPrice(finalTotal)}</span>
           </div>
        </div>

      </IonContent>

      {/* --- FOOTER --- */}
      <IonFooter className="ion-no-border" style={{ background: '#fff', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 16px' }}>
          <div style={{ marginRight: '16px', textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Tổng thanh toán</div>
            <div style={{ color: '#D32F2F', fontWeight: 'bold', fontSize: '18px' }}>{formatPrice(finalTotal)}</div>
          </div>
          <IonButton 
            onClick={handlePlaceOrder}
            disabled={checkoutItems.length === 0}
            style={{ 
              margin: 0, 
              '--background': PRIMARY_COLOR,
              '--border-radius': '4px',
              minWidth: '120px',
              fontWeight: '600',
              height: '40px'
            }}
          >
            ĐẶT HÀNG
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default CheckoutPage;