import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonImg,
  useIonViewWillEnter,
  useIonToast,
  IonButtons,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonRippleEffect,
} from "@ionic/react";
import { trashOutline, heartDislikeOutline, cartOutline, arrowForward } from "ionicons/icons";
import { useHistory } from "react-router-dom";

// --- TYPES ---
interface WishlistItem {
  id: number;
  name: string;
  image?: string | null;
  price: number;
}

const Tab3: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  
  // --- STATE ---
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- LIFECYCLE ---
  useIonViewWillEnter(() => {
    loadWishlist();
  });

  // --- LOGIC ---
  const loadWishlist = async () => {
    // Giả lập delay nhỏ để hiển thị Skeleton (UX mượt hơn là nháy hình)
    setLoading(true);
    try {
      const listJson = localStorage.getItem("wishlist");
      // setTimeout chỉ để demo hiệu ứng skeleton, thực tế có thể bỏ nếu đọc localstorage quá nhanh
      await new Promise(r => setTimeout(r, 300)); 
      setWishlist(listJson ? JSON.parse(listJson) : []);
    } catch (e) {
      console.error("Lỗi đọc wishlist", e);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadWishlist();
    event.detail.complete();
  };

  const removeFromWishlist = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newList = wishlist.filter((item) => String(item.id) !== String(id));
    setWishlist(newList);
    localStorage.setItem("wishlist", JSON.stringify(newList));
    
    presentToast({
      message: "Đã xóa khỏi yêu thích",
      duration: 1000,
      color: "dark", // Màu dark sang trọng hơn medium
      icon: trashOutline,
      position: "bottom",
      mode: "ios" // Toast bo tròn kiểu iOS đẹp hơn
    });
  };

  const goToDetail = (id: number) => {
    history.push(`/product/${id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // --- RENDER HELPERS ---

  // 1. Skeleton Loading (Chuẩn UX Mobile)
  const renderSkeletons = () => (
    <IonGrid className="ion-no-padding">
      <IonRow className="ion-padding-horizontal">
        {[1, 2, 3, 4].map((i) => (
          <IonCol size="6" sizeMd="4" sizeLg="3" key={i} style={{ padding: "6px" }}>
             <div style={{ background: "#fff", borderRadius: "16px", padding: "10px", height: "300px" }}>
                <IonSkeletonText animated style={{ width: "100%", height: "150px", borderRadius: "12px" }} />
                <IonSkeletonText animated style={{ width: "60%", height: "20px", marginTop: "15px" }} />
                <IonSkeletonText animated style={{ width: "80%", height: "16px", marginTop: "8px" }} />
                <IonSkeletonText animated style={{ width: "100%", height: "36px", marginTop: "20px", borderRadius: "8px" }} />
             </div>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );

  // 2. Empty State
  const renderEmptyState = () => (
    <div className="ion-text-center ion-padding" style={{ marginTop: "20%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ 
        background: "#eef2ff", width: "140px", height: "140px", 
        borderRadius: "50%", display: "flex", 
        alignItems: "center", justifyContent: "center",
        marginBottom: "24px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
      }}>
        <IonIcon icon={heartDislikeOutline} style={{ fontSize: "64px", color: "#6366f1" }} />
      </div>
      <h2 style={{ color: "#1f2937", fontWeight: "700", margin: "0 0 8px 0" }}>Danh sách trống</h2>
      <p style={{ color: "#6b7280", margin: "0 0 32px 0", maxWidth: "250px", lineHeight: "1.5" }}>
        Hãy thả tim <IonIcon icon={heartDislikeOutline} style={{verticalAlign: 'middle'}}/> các sản phẩm bạn yêu thích để xem lại tại đây nhé.
      </p>
      <IonButton routerLink="/home" shape="round" color="primary" style={{ height: "48px", width: "200px", "--box-shadow": "0 4px 12px rgba(99, 102, 241, 0.3)" }}>
        Khám phá ngay <IonIcon slot="end" icon={arrowForward} />
      </IonButton>
    </div>
  );

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontWeight: "700", fontSize: "20px" }}>Yêu thích</IonTitle>
          {wishlist.length > 0 && (
            <IonButtons slot="end">
               <IonButton color="medium" onClick={() => {
                   if(window.confirm("Xóa tất cả yêu thích?")) {
                       setWishlist([]);
                       localStorage.removeItem("wishlist");
                   }
               }}>
                   <span style={{ fontSize: "14px", fontWeight: "600" }}>Xóa tất cả</span>
               </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ "--background": "#f8f9fa" }}>
        {/* Pull to Refresh - Tính năng bắt buộc cho App list */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent pullingText="Kéo để làm mới" refreshingSpinner="crescent" />
        </IonRefresher>

        <IonHeader collapse="condense">
          <IonToolbar style={{ "--background": "#f8f9fa" }}>
            <IonTitle size="large" style={{ fontWeight: "800", color: "#111" }}>Yêu thích</IonTitle>
          </IonToolbar>
        </IonHeader>

        {loading ? renderSkeletons() : wishlist.length === 0 ? renderEmptyState() : (
          <IonGrid className="ion-no-padding">
            <IonRow className="ion-padding-horizontal" style={{ paddingBottom: "20px" }}>
              {wishlist.map((item) => (
                <IonCol size="6" sizeMd="4" sizeLg="3" key={item.id} style={{ padding: "6px" }}>
                  <IonCard 
                    button 
                    mode="ios" // Ép kiểu iOS để shadow đẹp hơn trên mọi nền tảng
                    onClick={() => goToDetail(item.id)}
                    style={{ 
                        margin: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        borderRadius: "16px", // Bo tròn mềm mại hơn
                        boxShadow: "0 8px 20px rgba(0,0,0,0.06)", // Shadow blur rộng, nhạt (Premium feel)
                        background: "#fff",
                        overflow: "hidden" // Để ripple không bị tràn
                    }}
                  >
                    {/* --- PHẦN 1: ẢNH & NÚT XÓA --- */}
                    <div style={{ position: "relative", width: "100%", paddingTop: "100%", background: "#f1f1f1" }}>
                        {/* Nút xóa - Glassmorphism style */}
                        <div 
                            className="ion-activatable ripple-parent"
                            onClick={(e) => removeFromWishlist(e, item.id)}
                            style={{
                                position: "absolute", top: "10px", right: "10px", zIndex: 10,
                                background: "rgba(255,255,255, 0.85)", 
                                backdropFilter: "blur(4px)", // Hiệu ứng mờ nền
                                borderRadius: "50%",
                                width: "32px", height: "32px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                cursor: "pointer"
                            }}
                        >
                            <IonIcon icon={trashOutline} color="danger" style={{ fontSize: "18px" }} />
                            <IonRippleEffect type="bounded" />
                        </div>

                        <IonImg 
                            src={item.image || "https://via.placeholder.com/300?text=GreenFarm"} 
                            style={{
                                position: "absolute", top: 0, left: 0,
                                width: "100%", height: "100%", objectFit: "cover"
                            }}
                        />
                    </div>

                    {/* --- PHẦN 2: THÔNG TIN --- */}
                    <IonCardContent style={{ 
                        padding: "12px", 
                        flexGrow: 1, 
                        display: "flex", 
                        flexDirection: "column" 
                    }}>
                        {/* Giá tiền - Điểm nhấn chính */}
                        <div style={{ 
                            color: "#d32f2f", // Màu đỏ chuẩn E-commerce
                            fontWeight: "700", 
                            fontSize: "15px",
                            marginBottom: "6px",
                            letterSpacing: "-0.5px"
                        }}>
                            {formatPrice(item.price)}
                        </div>

                        {/* Tên sản phẩm */}
                        <div style={{
                            fontSize: "13px",
                            color: "#374151", // Màu xám đậm (dễ đọc hơn đen tuyền)
                            fontWeight: "500",
                            lineHeight: "1.4",
                            height: "2.8em", 
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            marginBottom: "12px" 
                        }}>
                            {item.name}
                        </div>
                    </IonCardContent>

                    {/* --- PHẦN 3: ACTION BUTTON --- */}
                    <div style={{ padding: "0 10px 12px 10px", marginTop: "auto" }}>
                        <IonButton 
                            expand="block" 
                            size="small" 
                            // fill="solid" // Đổi sang Solid nhưng màu nhẹ
                            color="light" // Dùng màu Light để không bị nặng nề tranh chấp với ảnh
                            className="ion-no-margin"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToDetail(item.id);
                            }}
                            style={{ 
                                "--border-radius": "8px", 
                                height: "38px",
                                "--color": "#000", // Chữ đen cho rõ
                                fontWeight: "600",
                                fontSize: "12px"
                            }}
                        >
                            <IonIcon icon={cartOutline} slot="start" style={{ fontSize: "16px" }}/>
                            Mua ngay
                        </IonButton>
                    </div>

                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab3;