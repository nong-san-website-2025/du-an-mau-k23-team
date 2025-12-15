import React from 'react';
import { 
  IonCard, 
  IonCardContent, 
  IonButton, 
  IonIcon,
  IonRippleEffect
} from '@ionic/react';
import { cartOutline, star } from 'ionicons/icons'; 
import { Product } from '../../types/models'; 
import ProductImageComp from './ProductImage'; 

// --- CẤU HÌNH MÀU SẮC CHỦ ĐẠO ---
const PRIMARY_COLOR = '#2E7D32'; // Xanh lá đậm
const TEXT_COLOR = '#333333';
const SUB_TEXT_COLOR = '#888888';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToCart }) => {
  
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatSold = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const safeImageSrc = product.image || undefined;

  return (
    <IonCard 
      button={true}
      onClick={onClick}
      className="product-card"
      style={{ 
        margin: '5px', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)', // Shadow nhẹ hơn để card trông phẳng và hiện đại
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e0e0e0'
      }}
    >
      {/* --- PHẦN 1: HÌNH ẢNH (1:1) --- */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#f5f5f5' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <ProductImageComp 
            src={safeImageSrc} 
            alt={product.name} 
            className="product-image"
          />
        </div>

        {/* Badge: Đặt trước */}
        {product.preorder && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            background: '#FFA000', color: '#fff', // Màu cam đậm hơn chút cho dễ đọc
            fontSize: '9px', fontWeight: 'bold',
            padding: '2px 6px',
            borderBottomRightRadius: '6px',
            zIndex: 10
          }}>
            ĐẶT TRƯỚC
          </div>
        )}
      </div>

      {/* --- PHẦN 2: NỘI DUNG (Compact Layout) --- */}
      <IonCardContent style={{ 
        padding: '8px', // Giảm padding để tiết kiệm diện tích
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        textAlign: 'left',
        // Quan trọng: Sử dụng gap thay vì space-between để các phần tử gần nhau hơn
        gap: '4px' 
      }}>
        
        {/* 2.1 Tên sản phẩm */}
        <h3 style={{ 
          margin: 0, 
          fontSize: '13px', 
          fontWeight: '500', 
          color: TEXT_COLOR,
          lineHeight: '1.3',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '34px' // Giữ chiều cao cố định cho 2 dòng để card đều nhau
        }}>
          {product.name}
        </h3>

        {/* 2.2 Metadata: Rating + Đã bán (Gộp dòng để tiết kiệm chỗ) */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: SUB_TEXT_COLOR }}>
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                <IonIcon icon={star} style={{ color: '#FBC02D', fontSize: '10px', marginRight: '2px' }} />
                <span>{product.rating_average ? product.rating_average.toFixed(1) : '5.0'}</span>
            </div>
            
            {/* Divider */}
            <span style={{ margin: '0 4px', color: '#ddd' }}>|</span>

            {/* Sold */}
            <span>Đã bán {formatSold(product.ordered_quantity)}</span>
        </div>

        {/* Khoảng trống co giãn (nếu cần đẩy giá xuống đáy card) */}
        <div style={{ flexGrow: 1 }}></div>

        {/* 2.3 Giá & Nút Mua (Footer của card) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginTop: '4px' // Margin nhỏ để tách biệt một chút
        }}>
          
          {/* Giá tiền: Màu chủ đạo #2E7D32 */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
                color: PRIMARY_COLOR, 
                fontWeight: '700', 
                fontSize: '15px',
                lineHeight: '1'
            }}>
              {formatPrice(product.price)}
            </span>
            {/* Đơn vị tính (nhỏ phía dưới giá) */}
            {product.unit && (
                <span style={{ fontSize: '9px', color: SUB_TEXT_COLOR, marginTop: '2px' }}>
                    /{product.unit}
                </span>
            )}
          </div>

          {/* Nút thêm giỏ hàng: Màu chủ đạo */}
          <IonButton 
            fill="solid" 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onAddToCart) onAddToCart(e);
            }}
            style={{ 
              width: '28px', // Nút gọn hơn chút
              height: '28px', 
              margin: 0,
              '--background': PRIMARY_COLOR, // Set màu nền nút
              '--border-radius': '50%', // Tròn hẳn
              '--padding-start': '0',
              '--padding-end': '0',
              '--box-shadow': 'none' // Bỏ shadow nút cho phẳng
            }}
          >
            <IonIcon icon={cartOutline} style={{ fontSize: '16px', color: '#fff' }} />
          </IonButton>
        </div>

      </IonCardContent>
      
      <IonRippleEffect type="unbounded"></IonRippleEffect>
    </IonCard>
  );
};

export default React.memo(ProductCard, (prev, next) => {
  return prev.product.id === next.product.id && 
         prev.product.price === next.product.price &&
         prev.product.ordered_quantity === next.product.ordered_quantity;
});