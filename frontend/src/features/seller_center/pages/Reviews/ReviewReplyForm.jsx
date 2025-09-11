// src/features/seller_center/pages/Reviews/ReviewReplyForm.jsx
import React, { useState } from "react";
import axios from "axios";

const ReviewReplyForm = ({ reviewId, onReplyAdded }) => {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await axios.post("/api/review-replies/", {
        review: reviewId,
        reply_text: text,
      });
      setText("");
      if (onReplyAdded) onReplyAdded(res.data); // callback thêm reply vào list
    } catch (err) {
      console.error("Lỗi gửi reply:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "10px" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Trả lời..."
        style={{ marginRight: "5px", padding: "5px", width: "300px" }}
      />
      <button type="submit" style={{ padding: "5px 10px" }}>
        Gửi
      </button>
    </form>
  );
};

export default ReviewReplyForm;
