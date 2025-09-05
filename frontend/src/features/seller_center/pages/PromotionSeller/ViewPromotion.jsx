import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ViewPromotion = () => {
  const { id } = useParams();
  const [promo, setPromo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/promotions/${id}/`);
        setPromo(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPromotion();
  }, [id]);

  if (!promo) return <p>Đang tải chi tiết khuyến mãi...</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <h2>{promo.name}</h2>
      <p><strong>Loại:</strong> {promo.type}</p>
      <p><strong>Thời gian:</strong> {promo.start} - {promo.end}</p>
      <p><strong>Discount:</strong> {promo.discount_display}</p>
      <p><strong>Sản phẩm áp dụng:</strong> {promo.products}</p>
      <p><strong>Đã dùng/Tổng:</strong> {promo.used} / {promo.total}</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: "20px" }}>Quay lại</button>
    </div>
  );
};

export default ViewPromotion;
