import React from 'react';
import { IonRow, IonCol } from '@ionic/react';
import ProductCard from '../Product/ProductCard'; // Import component thẻ sản phẩm gốc của bạn
import { Product } from '../../types/models';

interface ProductListProps {
  products: Product[];
  onClick: (id: number) => void;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onClick, onAddToCart }) => {
  return (
    <IonRow className="ion-padding-horizontal">
      {products.map((product) => (
        <IonCol
          size="6"
          size-md="4"
          size-lg="3"
          key={product.id}
          style={{ padding: "8px" }}
        >
          <ProductCard
            product={product}
            onClick={() => onClick(product.id)}
            onAddToCart={(e) => onAddToCart(e, product)}
          />
        </IonCol>
      ))}
    </IonRow>
  );
};

export default React.memo(ProductList); // React.memo giúp tránh render lại không cần thiết