import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PromotionForm = () => {
  const [formData, setFormData] = useState({
    code: "", name: "", description: "", type: "", start: "", end: "", products: 0
  });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://127.0.0.1:8000/api/promotions/promotions/", formData)
      .then(() => {
        alert("Thêm mới thành công!");
        navigate("/seller-center/promotions");
      })
      .catch(err => {
        console.error(err.response?.data || err.message);
        alert("Thêm mới thất bại!");
      });
  };

  return (
    <div>
      <h2>Thêm Khuyến mãi mới</h2>
      <form onSubmit={handleSubmit}>
        <input name="code" placeholder="Code" value={formData.code} onChange={handleChange} required />
        <input name="name" placeholder="Tên" value={formData.name} onChange={handleChange} required />
        <input name="description" placeholder="Mô tả" value={formData.description} onChange={handleChange} />
        <input name="type" placeholder="Loại" value={formData.type} onChange={handleChange} />
        <input type="datetime-local" name="start" value={formData.start} onChange={handleChange} required />
        <input type="datetime-local" name="end" value={formData.end} onChange={handleChange} required />
        <input type="number" name="products" placeholder="Số sản phẩm" value={formData.products} onChange={handleChange} />
        <button type="submit">Lưu</button>
      </form>
    </div>
  );
};

export default PromotionForm;
