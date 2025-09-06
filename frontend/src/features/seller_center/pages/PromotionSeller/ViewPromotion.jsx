import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const ViewPromotion = () => {
  const { id } = useParams();
  const [promotion, setPromotion] = useState(null);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`)
      .then(res => setPromotion(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!promotion) return <p>Đang tải dữ liệu...</p>;

  return (
    <div>
      <h2>Chi tiết Khuyến mãi</h2>
      <p><strong>Mã:</strong> {promotion.code}</p>
      <p><strong>Tên:</strong> {promotion.name}</p>
      <p><strong>Mô tả:</strong> {promotion.description}</p>
      <p><strong>Loại:</strong> {promotion.type}</p>
      <p><strong>Bắt đầu:</strong> {promotion.start}</p>
      <p><strong>Kết thúc:</strong> {promotion.end}</p>
      <p><strong>Số sản phẩm:</strong> {promotion.products}</p>
    </div>
  );
};

export default ViewPromotion;
