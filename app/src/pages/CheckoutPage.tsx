import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonFooter,
  IonIcon,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonNote,
  IonLoading,
  IonInput,
  useIonRouter,
  IonText,
} from "@ionic/react";
import {
  locationOutline,
  chevronForward,
  cashOutline,
  cardOutline,
  ticketOutline,
  cubeOutline,
  storefrontOutline,
  chatbubbleEllipsesOutline,
  alertCircleOutline,
} from "ionicons/icons";

import useCheckoutLogic from "../hooks/useCheckoutLogic";
import AddressModal from "../components/Address/AddressModal";
import { Address } from "../types/Address";

const PRIMARY_COLOR = "#2E7D32";

const CheckoutPage: React.FC = () => {
  const router = useIonRouter();

  // Gọi Hook logic
  const {
    checkoutItems,
    groupedCheckoutItems,
    selectedAddress,
    totalGoods,
    shippingFee,
    shippingStatus, // Trạng thái tính phí (idle, loading, success, error)
    shippingFeePerSeller, // Object chứa phí ship từng shop { 'storeId': fee }
    discount,
    finalTotal,
    paymentMethod,
    setPaymentMethod,
    isProcessing,
    handlePlaceOrder,
    formatPrice,
    saveAddress,
  } = useCheckoutLogic();

  // State UI cục bộ
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Route Guard: Nếu không có hàng thì back về
  useEffect(() => {
    if (checkoutItems.length === 0) {
      router.push("/cart", "back", "replace");
    }
  }, [checkoutItems, router]);

  if (checkoutItems.length === 0) return null;

  return (
    <IonPage>
      <IonLoading
        isOpen={isProcessing}
        message={"Đang xử lý đơn hàng..."}
        spinner="crescent"
      />

      {/* --- HEADER --- */}
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ "--background": "#fff" }}>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()} color="dark">
              <IonIcon
                icon={chevronForward}
                style={{ transform: "rotate(180deg)" }}
              />
            </IonButton>
          </IonButtons>
          <IonTitle
            style={{ fontWeight: 600, fontSize: "18px", color: "#333" }}
          >
            Thanh toán
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding-bottom"
        style={{ "--background": "#f4f6f8" }}
      >
        {/* --- 1. ĐỊA CHỈ NHẬN HÀNG --- */}
        <div
          onClick={() => setShowAddressModal(true)}
          style={{
            background: "#fff",
            marginBottom: "10px",
            padding: "16px",
            position: "relative",
            // Hiệu ứng viền thư tín
            backgroundImage:
              "repeating-linear-gradient(45deg, #6fa6d6, #6fa6d6 33px, transparent 0, transparent 41px, #f18d9b 0, #f18d9b 74px, transparent 0, transparent 82px)",
            backgroundPosition: "top left",
            backgroundSize: "100% 3px",
            backgroundRepeat: "no-repeat",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
              color: PRIMARY_COLOR,
            }}
          >
            <IonIcon icon={locationOutline} style={{ marginRight: "8px" }} />
            <span style={{ fontWeight: "600" }}>Địa chỉ nhận hàng</span>
          </div>

          {selectedAddress ? (
            <div style={{ paddingLeft: "24px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "15px",
                  marginBottom: "4px",
                  color: "#333",
                }}
              >
                {selectedAddress.recipient_name} | {selectedAddress.phone}
              </div>
              <div
                style={{ fontSize: "13px", color: "#666", lineHeight: "1.4" }}
              >
                {selectedAddress.location}
              </div>
            </div>
          ) : (
            <div
              style={{
                paddingLeft: "24px",
                color: "#d32f2f",
                fontStyle: "italic",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <IonIcon icon={alertCircleOutline} />
              Vui lòng thêm địa chỉ nhận hàng
            </div>
          )}

          <IonIcon
            icon={chevronForward}
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#ccc",
            }}
          />
        </div>

        {/* --- 2. DANH SÁCH SẢN PHẨM (GOM NHÓM THEO SHOP) --- */}
        {Object.values(groupedCheckoutItems).map((group) => {
          // Lấy phí ship riêng của shop này từ object shippingFeePerSeller
          // Nếu chưa có (đang load) thì mặc định là 0
          const shopShippingFee = shippingFeePerSeller[group.storeId] || 0;

          return (
            <div
              key={group.storeId}
              style={{
                background: "#fff",
                marginBottom: "10px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {/* Header Cửa hàng */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IonIcon
                  icon={storefrontOutline}
                  size="small"
                  style={{ color: "#333" }}
                />
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  {group.storeName}
                </span>
              </div>

              {/* List sản phẩm */}
              <div style={{ padding: "16px 16px 0 16px" }}>
                {group.items.map((item, index) => {
                  const product = item.product_data;
                  if (!product) return null;
                  return (
                    <div
                      key={index}
                      style={{ display: "flex", marginBottom: "16px" }}
                    >
                      <img
                        src={
                          product.image || "https://via.placeholder.com/150"
                        }
                        alt={product.name}
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "4px",
                          objectFit: "cover",
                          background: "#f9f9f9",
                          border: "1px solid #eee",
                        }}
                      />
                      <div style={{ marginLeft: "12px", flex: 1 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            marginBottom: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#333",
                            maxWidth: "250px",
                          }}
                        >
                          {product.name}
                        </div>
                        {product.unit && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#999",
                              marginBottom: "4px",
                            }}
                          >
                            Phân loại: {product.unit}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: "12px", color: "#888" }}>
                            x{item.quantity}
                          </span>
                          <span
                            style={{
                              fontWeight: "500",
                              fontSize: "14px",
                              color: "#333",
                            }}
                          >
                            {formatPrice(product.price || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer của Shop (Lời nhắn + Phí ship riêng + Tổng tiền) */}
              <div
                style={{
                  borderTop: "1px dashed #eee",
                  padding: "10px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <IonIcon
                    icon={chatbubbleEllipsesOutline}
                    style={{
                      color: "#666",
                      marginRight: "8px",
                      fontSize: "18px",
                    }}
                  />
                  <IonLabel
                    style={{
                      fontSize: "13px",
                      color: "#333",
                      minWidth: "80px",
                    }}
                  >
                    Lời nhắn:
                  </IonLabel>
                  <IonInput
                    placeholder="Lưu ý cho shop..."
                    style={{
                      "--padding-start": "0",
                      fontSize: "13px",
                      textAlign: "right",
                      "--placeholder-opacity": "0.5",
                    }}
                  />
                </div>

                {/* ✅ MỚI: Hiển thị phí ship riêng cho Shop này */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    marginBottom: "6px",
                    color: "#666",
                  }}
                >
                  <span>Phí vận chuyển:</span>
                  <span>
                    {shippingStatus === "loading" ? (
                      "..."
                    ) : shippingStatus === "success" ? (
                      shopShippingFee > 0 ? (
                        formatPrice(shopShippingFee)
                      ) : (
                        "0đ"
                      )
                    ) : (
                      "---"
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#333" }}>
                    Tổng số tiền ({group.items.length} sp):
                  </span>
                  <span style={{ fontWeight: "600", color: PRIMARY_COLOR }}>
                    {/* Cộng tiền hàng + tiền ship của shop */}
                    {formatPrice(group.subtotal + shopShippingFee)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* --- 3. VOUCHER & VẬN CHUYỂN TỔNG QUAN --- */}
        <div
          style={{
            background: "#fff",
            marginBottom: "10px",
            padding: "0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <IonItem lines="full" detail={true} button>
            <IonIcon icon={ticketOutline} slot="start" color="warning" />
            <IonLabel style={{ fontSize: "14px" }}>GreenFarm Voucher</IonLabel>
            <IonNote
              slot="end"
              style={{ fontSize: "13px", color: PRIMARY_COLOR }}
            >
              {discount > 0 ? `-${formatPrice(discount)}` : "Chọn Voucher"}
            </IonNote>
          </IonItem>

          <IonItem lines="none" detail={true} button>
            <IonIcon icon={cubeOutline} slot="start" color="medium" />
            <IonLabel>
              <h3 style={{ fontSize: "14px", fontWeight: "600" }}>
                Phí vận chuyển tổng
              </h3>

              {/* ✅ HIỂN THỊ TRẠNG THÁI SHIP TỔNG */}
              <div style={{ marginTop: "4px" }}>
                {shippingStatus === "loading" && (
                  <span
                    style={{
                      color: "#f57f17",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <IonLoading isOpen={false} /> Đang tính toán...
                  </span>
                )}

                {shippingStatus === "success" && (
                  <span
                    style={{
                      color: PRIMARY_COLOR,
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    {shippingFee === 0
                      ? "Miễn phí vận chuyển"
                      : formatPrice(shippingFee)}
                  </span>
                )}

                {shippingStatus === "error" && (
                  <span style={{ color: "#d32f2f", fontSize: "13px" }}>
                    Không thể tính phí (Vui lòng kiểm tra địa chỉ)
                  </span>
                )}

                {shippingStatus === "idle" && (
                  <span
                    style={{
                      color: "#888",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    Vui lòng chọn địa chỉ nhận hàng
                  </span>
                )}
              </div>
            </IonLabel>
          </IonItem>
        </div>

        {/* --- 4. THANH TOÁN --- */}
        <div
          style={{
            background: "#fff",
            marginBottom: "10px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <IonIcon icon={cashOutline} color="success" />
            <h4
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Phương thức thanh toán
            </h4>
          </div>

          <IonRadioGroup
            value={paymentMethod}
            onIonChange={(e) => setPaymentMethod(e.detail.value)}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Option COD */}
              <div
                onClick={() => setPaymentMethod("cod")}
                style={{
                  flex: 1,
                  border: `1px solid ${
                    paymentMethod === "cod" ? PRIMARY_COLOR : "#ddd"
                  }`,
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                  background: paymentMethod === "cod" ? "#f1f8e9" : "#fff",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                <IonIcon
                  icon={cashOutline}
                  size="large"
                  color={paymentMethod === "cod" ? "success" : "medium"}
                />
                <div
                  style={{
                    fontWeight: "500",
                    fontSize: "12px",
                    marginTop: "5px",
                  }}
                >
                  Tiền mặt
                </div>
                <IonRadio value="cod" style={{ display: "none" }} />
              </div>

              {/* Option Banking */}
              <div
                onClick={() => setPaymentMethod("banking")}
                style={{
                  flex: 1,
                  border: `1px solid ${
                    paymentMethod === "banking" ? PRIMARY_COLOR : "#ddd"
                  }`,
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                  background:
                    paymentMethod === "banking" ? "#f1f8e9" : "#fff",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                <IonIcon
                  icon={cardOutline}
                  size="large"
                  color={paymentMethod === "banking" ? "success" : "medium"}
                />
                <div
                  style={{
                    fontWeight: "500",
                    fontSize: "12px",
                    marginTop: "5px",
                  }}
                >
                  Chuyển khoản
                </div>
                <IonRadio value="banking" style={{ display: "none" }} />
              </div>
            </div>
          </IonRadioGroup>
        </div>

        {/* --- 5. TỔNG KẾT --- */}
        <div
          style={{
            background: "#fff",
            padding: "16px",
            paddingBottom: "100px",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "14px",
              fontWeight: "600",
              color: "#333",
            }}
          >
            Chi tiết thanh toán
          </h4>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "13px",
              color: "#666",
            }}
          >
            <span>Tổng tiền hàng</span>
            <span>{formatPrice(totalGoods)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "13px",
              color: "#666",
            }}
          >
            <span>Tổng phí vận chuyển</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "13px",
              color: "#666",
            }}
          >
            <span>Giảm giá</span>
            <span>-{formatPrice(discount)}</span>
          </div>
          <div
            style={{ borderTop: "1px dashed #ddd", margin: "8px 0" }}
          ></div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "15px", fontWeight: "600", color: "#333" }}
            >
              Tổng thanh toán
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#D32F2F",
              }}
            >
              {formatPrice(finalTotal)}
            </span>
          </div>
        </div>
      </IonContent>

      {/* --- FOOTER --- */}
      <IonFooter
        className="ion-no-border"
        style={{ background: "#fff", borderTop: "1px solid #eee" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "10px 16px",
          }}
        >
          <div style={{ marginRight: "16px", textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Tổng thanh toán
            </div>
            <div
              style={{
                color: "#D32F2F",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {formatPrice(finalTotal)}
            </div>
          </div>
          <IonButton
            onClick={handlePlaceOrder}
            disabled={checkoutItems.length === 0}
            style={{
              margin: 0,
              "--background": PRIMARY_COLOR,
              "--border-radius": "8px",
              minWidth: "130px",
              fontWeight: "700",
              height: "44px",
              "--box-shadow": "0 4px 10px rgba(46, 125, 50, 0.3)",
            }}
          >
            ĐẶT HÀNG
          </IonButton>
        </div>
      </IonFooter>

      {/* --- MODAL ADD ADDRESS --- */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        initialData={selectedAddress}
        onSave={async (data) => {
          await saveAddress(data);
        }}
      />
    </IonPage>
  );
};

export default CheckoutPage;