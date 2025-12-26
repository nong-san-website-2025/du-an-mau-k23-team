import React, { useMemo } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonIcon,
  IonBadge,
  IonThumbnail,
  IonNote,
  IonButton
} from "@ionic/react";
import { 
  star, 
  starHalf, 
  starOutline, 
  personCircleOutline, 
  storefrontOutline, 
  checkmarkCircle, 
  alertCircle 
} from "ionicons/icons";

// --- DEFINITIONS (Giữ nguyên) ---

type ImageSource = string | { image?: string; url?: string };

interface ReviewReply {
  id: number | string;
  created_at: string;
  reply_text?: string;
  comment?: string;
  detail?: string;
}

export interface ReviewData {
  id: number | string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  replies?: ReviewReply[];
  is_hidden?: boolean;
  images?: ImageSource[];
}

interface UserData {
  id: number | string;
  name?: string;
  [key: string]: any;
}

// --- HELPER FUNCTIONS ---

const getImageUrl = (imgData: ImageSource): string => {
  if (!imgData) return "";
  let src = "";
  if (typeof imgData === 'string') {
    src = imgData;
  } else {
    src = imgData.image || imgData.url || "";
  }
  if (!src) return "";
  if (src.startsWith("http")) return src;

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const BASE_URL = API_URL.replace(/\/api\/?$/, "");
  const cleanSrc = src.startsWith("/") ? src : `/${src}`;
  return `${BASE_URL}${cleanSrc}`;
};

// --- SUB-COMPONENT: STAR RATING (Ionic Custom) ---
const StarRating: React.FC<{ rating: number; size?: string }> = ({ rating, size = "16px" }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<IonIcon key={i} icon={star} color="warning" style={{ fontSize: size }} />);
    } else if (rating >= i - 0.5) {
      stars.push(<IonIcon key={i} icon={starHalf} color="warning" style={{ fontSize: size }} />);
    } else {
      stars.push(<IonIcon key={i} icon={starOutline} color="medium" style={{ fontSize: size }} />);
    }
  }
  return <div style={{ display: 'flex', gap: '2px' }}>{stars}</div>;
};

// --- SUB-COMPONENT: REVIEW ITEM ---

interface ReviewItemProps {
  review: ReviewData;
  isMyReview?: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review, isMyReview = false }) => {
  const { user_name, rating, comment, created_at, replies, is_hidden, images } = review;

  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
      {/* Header: Avatar + Tên + Ngày */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
        <IonAvatar style={{ width: "40px", height: "40px" }}>
           {/* Fallback avatar nếu không có ảnh user */}
           <div style={{ 
               width: '100%', height: '100%', 
               background: isMyReview ? '#3880ff' : '#e0e0e0', 
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               color: '#fff', fontWeight: 'bold', fontSize: '18px'
           }}>
             {user_name ? user_name.charAt(0).toUpperCase() : <IonIcon icon={personCircleOutline} />}
           </div>
        </IonAvatar>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <IonText color="dark" style={{ fontWeight: "600", fontSize: "15px" }}>
              {isMyReview ? "Bạn" : user_name}
            </IonText>
            <IonNote style={{ fontSize: "12px" }}>
              {new Date(created_at).toLocaleDateString("vi-VN")}
            </IonNote>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <StarRating rating={rating} size="14px" />
            
            {/* Badges trạng thái */}
            {isMyReview && is_hidden && (
               <IonBadge color="danger" style={{ fontSize: '10px' }}>
                 <IonIcon icon={alertCircle} style={{ verticalAlign: 'middle', marginRight: 2 }}/> Bị ẩn
               </IonBadge>
            )}
            {isMyReview && !is_hidden && (
               <IonBadge color="success" style={{ fontSize: '10px' }}>
                 <IonIcon icon={checkmarkCircle} style={{ verticalAlign: 'middle', marginRight: 2 }}/> Đã duyệt
               </IonBadge>
            )}
          </div>
        </div>
      </div>

      {/* Nội dung Comment */}
      <div style={{ paddingLeft: "52px" }}>
        <IonText 
          color={is_hidden ? "medium" : "dark"} 
          style={{ 
            fontSize: "14px", 
            fontStyle: is_hidden ? "italic" : "normal",
            display: "block",
            marginBottom: "12px",
            lineHeight: "1.5"
          }}
        >
          {is_hidden ? "Nội dung đánh giá này đã bị ẩn do vi phạm tiêu chuẩn cộng đồng." : comment}
        </IonText>

        {/* Danh sách ảnh */}
        {!is_hidden && images && images.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {images.map((img, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: "70px", height: "70px", 
                  borderRadius: "8px", overflow: "hidden", 
                  border: "1px solid #eee" 
                }}
              >
                <img 
                  src={getImageUrl(img)} 
                  alt="Review" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/70?text=Error"; }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Phản hồi của Shop */}
        {Array.isArray(replies) && replies.length > 0 && (
          <div style={{ 
              background: "#f4f5f8", 
              padding: "12px", 
              borderRadius: "8px", 
              borderLeft: "3px solid var(--ion-color-success)" 
          }}>
            {replies.map((rp) => (
              <div key={rp.id}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <IonIcon icon={storefrontOutline} color="success" />
                  <IonText color="success" style={{ fontWeight: "bold", fontSize: "13px" }}>Phản hồi từ Cửa hàng</IonText>
                  <IonText color="medium" style={{ fontSize: "11px" }}>• {rp.created_at ? new Date(rp.created_at).toLocaleDateString("vi-VN") : ""}</IonText>
                </div>
                <IonText color="dark" style={{ fontSize: "13px" }}>
                  {rp.reply_text || rp.comment || rp.detail || ""}
                </IonText>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: RATING SUMMARY ---

interface RatingSummaryProps {
  reviews: ReviewData[];
}

const RatingSummary: React.FC<RatingSummaryProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return null;

  const total = reviews.length;
  const average = (reviews.reduce((acc, cur) => acc + cur.rating, 0) / total).toFixed(1);
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  reviews.forEach(r => {
    const rounded = Math.round(r.rating);
    if (counts[rounded] !== undefined) counts[rounded]++;
  });

  return (
    <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
      <IonGrid className="ion-no-padding">
        <IonRow className="ion-align-items-center">
          {/* Cột trái: Điểm số to */}
          <IonCol size="4" className="ion-text-center" style={{ borderRight: "1px solid #ddd" }}>
             <div style={{ fontSize: "36px", fontWeight: "bold", color: "var(--ion-color-warning)" }}>
               {average}
             </div>
             <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                <StarRating rating={parseFloat(average)} size="12px" />
             </div>
             <IonText color="medium" style={{ fontSize: "12px" }}>{total} đánh giá</IonText>
          </IonCol>

          {/* Cột phải: Thanh Progress */}
          <IonCol size="8" style={{ paddingLeft: "16px" }}>
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <IonText style={{ fontSize: "12px", width: "35px", fontWeight: "600" }}>{star} sao</IonText>
                <div style={{ flex: 1, margin: "0 8px" }}>
                  <IonProgressBar 
                    value={counts[star] / total} 
                    color="warning" 
                    style={{ height: "6px", borderRadius: "3px" }} 
                  />
                </div>
                <IonText color="medium" style={{ fontSize: "11px", width: "20px", textAlign: "right" }}>
                  {counts[star]}
                </IonText>
              </div>
            ))}
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface ReviewsSectionProps {
  user?: UserData | null;
  reviews?: ReviewData[];
  myReview?: ReviewData | null;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ user, reviews = [], myReview }) => {
  
  const visibleReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(r => !r.is_hidden);
  }, [reviews]);

  return (
    <IonCard style={{ boxShadow: "none", border: "1px solid #eee", margin: "16px 0" }}>
      <IonCardHeader>
        <IonCardTitle style={{ fontSize: "18px" }}>Đánh giá sản phẩm</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        {/* 1. Tổng quan */}
        <RatingSummary reviews={visibleReviews} />

        {/* 2. Review của tôi */}
        {user && myReview && (
          <div style={{ marginBottom: "24px" }}>
             <IonText color="primary" style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
               Đánh giá của bạn
             </IonText>
             <div style={{ 
                 background: myReview.is_hidden ? '#fff5f5' : '#f0f8ff', 
                 borderRadius: "12px", 
                 border: `1px solid ${myReview.is_hidden ? '#feb2b2' : '#bee3f8'}` 
             }}>
                {/* Wrap trong div padding riêng vì ReviewItem có padding dọc */}
                <div style={{ padding: "0 12px" }}>
                  <ReviewItem review={myReview} isMyReview={true} />
                </div>
             </div>
          </div>
        )}

        {/* 3. Danh sách review khác */}
        {visibleReviews.length > 0 && (
           <IonList lines="none">
              {/* Tiêu đề nếu cần */}
              {user && myReview && visibleReviews.length > 1 && (
                <IonText color="medium" style={{ fontSize: "14px", fontWeight: "600", marginTop: "16px", display: "block" }}>
                  Khách hàng khác
                </IonText>
              )}

              {/* Loop items */}
              {visibleReviews.map((item) => (
                 (!myReview || item.id !== myReview.id) ? (
                    <ReviewItem key={item.id} review={item} />
                 ) : null
              ))}
              
              {visibleReviews.length === 0 && !myReview && (
                 <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    Chưa có đánh giá nào.
                 </div>
              )}
           </IonList>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ReviewsSection;