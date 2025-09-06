import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditPromotion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`)
      .then(res => setFormData(res.data))
      .catch(err => console.error(err));
  }, [id]);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`, formData)
      .then(() => {
        alert("Cập nhật thành công!");
        navigate("/seller-center/promotions");
      })
      .catch(err => {
        console.error(err.response?.data || err.message);
        alert("Cập nhật thất bại!");
      });
  };

  return (
    <div>
      <h2>Sửa Khuyến mãi</h2>
      <form onSubmit={handleSubmit}>
        <input name="code" value={formData.code || ""} onChange={handleChange} required />
        <input name="name" value={formData.name || ""} onChange={handleChange} required />
        <input name="description" value={formData.description || ""} onChange={handleChange} />
        <input name="type" value={formData.type || ""} onChange={handleChange} />
        <input type="datetime-local" name="start" value={formData.start || ""} onChange={handleChange} required />
        <input type="datetime-local" name="end" value={formData.end || ""} onChange={handleChange} required />
        <input type="number" name="products" value={formData.products || 0} onChange={handleChange} />
        <button type="submit">Lưu</button>
      </form>
    </div>
  );
};

export default EditPromotion;
