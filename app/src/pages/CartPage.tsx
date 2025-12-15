import React, { useState, useMemo } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonList,
  IonImg,
  IonThumbnail,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonAlert,
  IonText,
  useIonRouter,
  IonSkeletonText,
} from "@ionic/react";
import {
  storefrontOutline,
  trashOutline,
  ticketOutline,
  chevronForwardOutline,
  addOutline,
  removeOutline,
  cartOutline,
} from "ionicons/icons";

// 👇 Import Context và Helper
import { useCart, getItemProductId, CartItem } from "../context/CartContext";

// 👇 Màu chủ đạo
const THEME_COLOR = "#2E7D32";

// 👇 Hàm format tiền tệ
const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );

// --- Component phụ: Input số lượng ---
const MobileQuantityInput: React.FC<{
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}> = ({ quantity, onDecrease, onIncrease }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      border: "1px solid #ddd",
      borderRadius: "4px",
      height: "32px",
      width: "fit-content",
      marginTop: "8px",
      backgroundColor: "#fff",
    }}
  >
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDecrease();
      }}
      style={{
        background: "transparent",
        border: "none",
        width: "32px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <IonIcon icon={removeOutline} size="small" />
    </button>
    <span
      style={{
        padding: "0 8px",
        fontSize: "14px",
        fontWeight: "500",
        minWidth: "24px",
        textAlign: "center",
        borderLeft: "1px solid #eee",
        borderRight: "1px solid #eee",
      }}
    >
      {quantity}
    </span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onIncrease();
      }}
      style={{
        background: "transparent",
        border: "none",
        width: "32px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <IonIcon icon={addOutline} size="small" />
    </button>
  </div>
);

// --- Định nghĩa Types cho việc Gom nhóm ---
interface StoreGroup {
  storeName: string;
  storeId: string;
  items: CartItem[];
}

interface GroupedItems {
  [key: string]: StoreGroup;
}

const CartPage: React.FC = () => {
  const router = useIonRouter();
  const {
    cartItems,
    selectAllItems,
    deselectAllItems,
    toggleItem,
    updateQuantity,
    removeFromCart,
    loading,
    cartItemCount,
  } = useCart();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // --- 1. Logic Gom nhóm theo Store ---
  const groupedItems = useMemo(() => {
    return cartItems.reduce<GroupedItems>((acc, item) => {
      const product = item.product_data;
      if (!product) return acc;

      let storeId = "other";
      let storeName = "Cửa hàng khác";

      if (product.store && typeof product.store === "object") {
        storeId = String(product.store.id);
        storeName =
          product.store.store_name || product.store.name || "Cửa hàng";
      } else if (product.store_name) {
        storeName = product.store_name;
      }

      if (!acc[storeId]) {
        acc[storeId] = {
          storeName,
          storeId,
          items: [],
        };
      }
      acc[storeId].items.push(item);
      return acc;
    }, {});
  }, [cartItems]);

  // --- 2. Tính tổng tiền các món được chọn ---
  const selectedItems = useMemo(
    () => cartItems.filter((i) => i.selected),
    [cartItems]
  );

  const selectedTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const price = item.product_data?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [selectedItems]);

  const allChecked =
    cartItems.length > 0 && cartItems.every((item) => item.selected);

  // --- Handlers ---
  const handleToggleCheckAll = () => {
    if (allChecked) deselectAllItems();
    else selectAllItems();
  };

  const handleDelete = async () => {
    if (confirmDeleteId) {
      await removeFromCart(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  // --- RENDER ---

  // Loading State
  if (loading && cartItems.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ "--background": THEME_COLOR, color: "#fff" }}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" color="light" />
            </IonButtons>
            <IonTitle style={{ color: "#fff" }}>Giỏ hàng</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <IonSkeletonText
                animated
                style={{ width: "100%", height: "150px", borderRadius: "8px" }}
              />
            </div>
          ))}
        </IonContent>
      </IonPage>
    );
  }

  // Empty State
  if (cartItemCount === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ "--background": THEME_COLOR, color: "#fff" }}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" color="light" />
            </IonButtons>
            <IonTitle style={{ color: "#fff" }}>Giỏ hàng</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div
            style={{
              marginTop: "30vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <IonIcon
              icon={cartOutline}
              style={{
                fontSize: "80px",
                color: "#e0e0e0",
                marginBottom: "16px",
              }}
            />
            <IonText color="medium">
              <h3>Giỏ hàng của bạn đang trống</h3>
            </IonText>
            <p className="ion-text-muted">Hãy thêm vài món ngon nhé!</p>
            <IonButton
              onClick={() => router.push("/home")}
              shape="round"
              className="ion-margin-top"
              style={{
                width: "200px",
                "--background": THEME_COLOR, // Áp dụng màu nút
              }}
            >
              Tiếp tục mua sắm
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        {/* Toolbar Header với màu chủ đạo */}
        <IonToolbar style={{ "--background": THEME_COLOR, color: "#fff" }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" color="light" />
          </IonButtons>
          <IonTitle style={{ color: "#fff" }}>
            Giỏ hàng ({cartItemCount})
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding-bottom"
        style={{ "--background": "#f4f5f8" }}
      >
        {/* Render danh sách theo Group Store */}
        {Object.values(groupedItems).map((group) => (
          <IonCard
            key={group.storeId}
            style={{
              margin: "12px 10px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              backgroundColor: "#fff",
            }}
          >
            {/* Store Header */}
            <IonCardHeader
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                onClick={() => router.push(`/store/${group.storeId}`)}
              >
                <IonIcon icon={storefrontOutline} color="dark" />
                <IonText
                  color="dark"
                  style={{ fontWeight: "700", fontSize: "15px" }}
                >
                  {group.storeName}
                </IonText>
                <IonIcon
                  icon={chevronForwardOutline}
                  size="small"
                  color="medium"
                />
              </div>

              {/* Nút Voucher */}
              <IonButton
                fill="clear"
                size="small"
                style={{
                  height: "24px",
                  margin: 0,
                  "--color": THEME_COLOR, // Màu text voucher
                }}
              >
                <IonIcon
                  icon={ticketOutline}
                  slot="start"
                  style={{ fontSize: "16px", color: THEME_COLOR }}
                />
                <span style={{ fontSize: "12px", color: THEME_COLOR }}>
                  Voucher
                </span>
              </IonButton>
            </IonCardHeader>

            <IonCardContent style={{ padding: "0" }}>
              <IonList lines="full">
                {group.items.map((item) => {
                  if (!item.product_data) return null;
                  const displayProd = item.product_data;
                  const itemId = getItemProductId(item);

                  return (
                    <IonItemSliding key={itemId}>
                      <IonItem
                        lines="none"
                        style={{
                          alignItems: "flex-start",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                          "--inner-padding-end": "10px",
                        }}
                      >
                        {/* Checkbox sản phẩm */}
                        <IonCheckbox
                          slot="start"
                          checked={item.selected}
                          onIonChange={() => toggleItem(itemId)}
                          style={{
                            marginTop: "30px",
                            marginRight: "16px",
                            "--size": "20px",
                            "--checkbox-background-checked": THEME_COLOR, // Màu khi check
                            "--border-color-checked": THEME_COLOR,
                          }}
                        />

                        {/* Ảnh sản phẩm */}
                        <IonThumbnail
                          slot="start"
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "8px",
                            marginTop: "0",
                          }}
                        >
                          <IonImg
                            src={
                              displayProd.image ||
                              "https://via.placeholder.com/80"
                            }
                            alt={displayProd.name}
                            style={{
                              objectFit: "cover",
                              borderRadius: "8px",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        </IonThumbnail>

                        {/* Thông tin + Bộ chỉnh số lượng */}
                        <IonLabel
                          className="ion-text-wrap"
                          style={{ margin: 0 }}
                        >
                          <h3
                            style={{
                              fontWeight: "600",
                              fontSize: "14px",
                              lineHeight: "1.4",
                              marginBottom: "6px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {displayProd.name}
                          </h3>

                          {displayProd.unit && (
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#888",
                                marginBottom: "4px",
                              }}
                            >
                              Đvt: {displayProd.unit}
                            </p>
                          )}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-end",
                              marginTop: "auto",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  color: "#d32f2f", // Giữ màu đỏ cho giá để nổi bật
                                  fontWeight: "700",
                                  fontSize: "15px",
                                  marginBottom: "6px",
                                }}
                              >
                                {formatPrice(displayProd.price || 0)}
                              </p>

                              <MobileQuantityInput
                                quantity={item.quantity}
                                onDecrease={() =>
                                  updateQuantity(itemId, item.quantity - 1)
                                }
                                onIncrease={() =>
                                  updateQuantity(itemId, item.quantity + 1)
                                }
                              />
                            </div>
                          </div>
                        </IonLabel>
                      </IonItem>

                      <IonItemOptions side="end">
                        <IonItemOption
                          color="danger"
                          onClick={() => setConfirmDeleteId(itemId)}
                        >
                          <IonIcon slot="icon-only" icon={trashOutline} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  );
                })}
              </IonList>
            </IonCardContent>
          </IonCard>
        ))}

        {/* Spacer */}
        <div style={{ height: "80px" }}></div>
      </IonContent>

      {/* --- FOOTER --- */}
      <IonFooter className="ion-no-border">
        <IonToolbar
          style={{
            "--background": "#fff",
            borderTop: "1px solid #eee",
            paddingBottom: "var(--ion-safe-area-bottom, 0)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              height: "64px",
            }}
          >
            {/* Select All */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: "auto",
              }}
            >
              <IonCheckbox
                checked={allChecked}
                onIonChange={handleToggleCheckAll}
                style={{
                  marginRight: "8px",
                  "--size": "20px",
                  "--checkbox-background-checked": THEME_COLOR, // Màu khi check
                  "--border-color-checked": THEME_COLOR,
                }}
              />
              <IonLabel
                style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}
              >
                Tất cả ({cartItemCount})
              </IonLabel>
            </div>

            {/* Total & Checkout */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#666" }}>Tổng tiền</div>
                <div
                  style={{
                    color: "#d32f2f", // Giá tiền giữ màu đỏ
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {formatPrice(selectedTotal)}
                </div>
              </div>

              {/* Nút Mua Hàng */}
              <IonButton
                shape="round"
                disabled={selectedItems.length === 0}
                onClick={() => router.push("/checkout")}
                style={{
                  fontWeight: "600",
                  minWidth: "110px",
                  height: "40px",
                  "--background": THEME_COLOR, // Màu nền nút
                  "--background-activated": "#1b5e20", // Màu khi nhấn (đậm hơn chút)
                  "--box-shadow": "none",
                }}
              >
                Mua Hàng
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>

      {/* Alert Confirm Delete */}
      <IonAlert
        isOpen={!!confirmDeleteId}
        onDidDismiss={() => setConfirmDeleteId(null)}
        header="Xác nhận xoá"
        message="Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?"
        buttons={[
          {
            text: "Hủy",
            role: "cancel",
            cssClass: "secondary",
          },
          {
            text: "Xóa",
            role: "destructive",
            handler: handleDelete,
          },
        ]}
      />
    </IonPage>
  );
};

export default CartPage;