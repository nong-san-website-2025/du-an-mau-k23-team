import React, { useEffect, useState } from "react";
import axios from "axios";

// Avatar giả
const userAvatar = "https://i.pravatar.cc/40";
const shopAvatar = "https://i.pravatar.cc/40?img=50";

const ProductReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reviewsUrl = "http://127.0.0.1:8000/reviews/";
    const repliesUrl = "http://127.0.0.1:8000/review-replies/";

    Promise.all([axios.get(reviewsUrl), axios.get(repliesUrl)])
      .then(([reviewsRes, repliesRes]) => {
        setReviews(reviewsRes.data.results || reviewsRes.data);
        setReplies(repliesRes.data.results || repliesRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi fetch reviews/replies:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Đang tải đánh giá...</p>;
  if (!reviews.length) return <p>Chưa có đánh giá nào.</p>;

  // Lấy reply cho từng review, fix URL hoặc ID
  const getReplies = (reviewId) => {
    return replies.filter(r => {
      if (!r.review) return false;
      if (typeof r.review === "string") {
        const idFromUrl = parseInt(r.review.split("/").filter(Boolean).pop());
        return idFromUrl === reviewId;
      }
      return r.review === reviewId;
    });
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", fontFamily: "Roboto, Arial, Helvetica, sans-serif" }}>
      <h2
        style={{
          textAlign: "center",
          fontSize: "1.35rem",
          marginTop: "28px",
          marginBottom: "18px",
          color: "#2c3e50",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        ĐÁNH GIÁ SẢN PHẨM
      </h2>

      {reviews.map((review) => (
        <div
          key={review.id}
          style={{
            border: "none",
            borderRadius: "12px",
            padding: "14px 16px 12px 16px",
            marginBottom: "18px",
            backgroundColor: "#f9fafb",
            boxShadow: "0 2px 8px rgba(44,62,80,0.07)",
            transition: "box-shadow 0.2s",
          }}
        >
          {/* Header review */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <img src={userAvatar} alt="avatar" style={{ borderRadius: "50%", marginRight: "10px", width: 32, height: 32 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: "1rem", color: "#34495e" }}>{review.customer_name}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#7f8c8d" }}>{review.date}</p>
            </div>
          </div>

          {/* Thông tin review */}
          <p style={{ margin: "4px 0", color: "#2c3e50", fontSize: "0.97rem" }}>
            <strong>Sản phẩm:</strong> {review.product_name}
          </p>
          <p style={{ margin: "4px 0", color: "#f39c12", fontWeight: 500, fontSize: "0.97rem" }}>
            Đánh giá: {"⭐".repeat(review.rating)}
          </p>
          <p style={{ margin: "4px 0 8px", color: "#34495e", fontSize: "0.97rem" }}>{review.comment}</p>

          {/* Shop reply */}
          {getReplies(review.id).length > 0 && (
            <div style={{ marginTop: "12px" }}>
              {getReplies(review.id).map(reply => (
                <div key={reply.id} style={{ display: "flex", marginBottom: "7px" }}>
                  <img src={shopAvatar} alt="shop" style={{ borderRadius: "50%", marginRight: "8px", width: 28, height: 28 }} />
                  <div style={{ backgroundColor: "#eaf0f6", padding: "7px 10px", borderRadius: "8px", flex: 1, color: "#2c3e50", fontSize: "0.97rem" }}>
                    <strong style={{ color: "#1890ff" }}>Shop trả lời:</strong> <br />
                    {reply.content || "Nội dung trống"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductReviews;
