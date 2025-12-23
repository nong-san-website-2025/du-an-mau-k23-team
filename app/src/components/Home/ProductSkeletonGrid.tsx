import React from 'react';
import { IonRow, IonCol, IonCard, IonSkeletonText, IonCardContent } from '@ionic/react';

// Component con nội bộ: 1 thẻ Skeleton
const SkeletonItem: React.FC = () => (
  <IonCol size="6" size-md="4" size-lg="3" style={{ padding: "8px" }}>
    <IonCard
      className="ion-no-margin"
      style={{
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        border: "1px solid #e0e0e0",
        background: "#fff",
      }}
    >
      {/* Ảnh giả lập */}
      <IonSkeletonText animated style={{ height: "0", paddingBottom: "100%", width: "100%", margin: 0 }} />
      
      <IonCardContent style={{ padding: "8px" }}>
        {/* Tên sản phẩm */}
        <IonSkeletonText animated style={{ width: "90%", height: "14px", marginBottom: "8px" }} />
        <IonSkeletonText animated style={{ width: "40%", height: "10px", marginBottom: "12px" }} />
        
        {/* Giá và nút mua */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <IonSkeletonText animated style={{ width: "60%", height: "20px" }} />
          <IonSkeletonText animated style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
        </div>
      </IonCardContent>
    </IonCard>
  </IonCol>
);

interface Props {
  count?: number; // Số lượng skeleton muốn hiện
}

const ProductSkeletonGrid: React.FC<Props> = ({ count = 8 }) => {
  return (
    <IonRow className="ion-padding-horizontal">
      {[...Array(count)].map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </IonRow>
  );
};

export default ProductSkeletonGrid;