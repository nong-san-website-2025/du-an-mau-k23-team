// src/pages/ProductDetail.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonImg,
  IonText,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  useIonToast,
} from "@ionic/react";
import { cartOutline } from "ionicons/icons";
import { useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { productApi } from "../../api/productApi";
import { formatPriceVND } from "../../utils/formatPrice";
import AppHeader from "../../components/AppHeader";

interface Product {
  id: number;
  name: string;
  brand?: string;
  price: number;
  image?: string;
  description?: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const [present] = useIonToast();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("ID sản phẩm không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const productId = Number(id);
        if (isNaN(productId)) {
          throw new Error("ID sản phẩm không phải là số");
        }

        const data = await productApi.getProduct(productId);
        setProduct(data);
      } catch (err: unknown) {
        // 👈 dùng unknown thay vì any
        let msg = "Không thể tải sản phẩm";

        // Kiểm tra kiểu an toàn trước khi dùng .message
        if (err instanceof Error) {
          if (err.message.includes("404")) {
            msg = "Sản phẩm không tồn tại hoặc đã bị ẩn";
          } else {
            msg = err.message;
          }
        } else if (typeof err === "string") {
          msg = err;
        }
        // Nếu err là object/response, bạn có thể mở rộng thêm

        console.error("Lỗi khi tải sản phẩm:", err);
        setError(msg);

        present({
          message: msg,
          color: "danger",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, present]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ "--background": "#4caf50" }}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" color="light" />
            </IonButtons>
            <IonTitle color="light">Đang tải...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="ion-text-center" style={{ padding: "40px" }}>
            <IonText>Đang tải thông tin sản phẩm...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !product) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ "--background": "#4caf50" }}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" color="light" />
            </IonButtons>
            <IonTitle color="light">Lỗi</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger" style={{ fontSize: "1.1rem" }}>
            {error || "Sản phẩm không tồn tại"}
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <AppHeader showBack={true} showSearch={false}  />

      <IonContent>
        <IonImg
          src={
            product.image ||
            `https://via.placeholder.com/400x400?text=${encodeURIComponent(
              product.name
            )}`
          }
          alt={product.name}
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
          }}
        />

        <IonCard style={{ margin: "16px", borderRadius: "16px" }}>
          <IonCardContent>
            <IonText color="medium" style={{ fontSize: "0.9rem" }}>
              {product.brand || "Thương hiệu"}
            </IonText>
            <h2 style={{ margin: "8px 0", fontWeight: "600" }}>
              {product.name}
            </h2>

            <IonText
              color="danger"
              style={{ fontSize: "1.4rem", fontWeight: "bold" }}
            >
              {formatPriceVND(product.price)}đ
            </IonText>

            {product.description && (
              <div style={{ margin: "16px 0" }}>
                <IonText color="medium">
                  <h3 style={{ margin: "12px 0" }}>Mô tả</h3>
                  <p style={{ lineHeight: 1.5 }}>{product.description}</p>
                </IonText>
              </div>
            )}

            <IonButton
              expand="block"
              color="success"
              onClick={handleAddToCart}
              style={{ marginTop: "16px" }}
            >
              <IonIcon icon={cartOutline} slot="start" />
              Thêm vào giỏ
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ProductDetail;
