import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const EditPromotion = () => {
  const { id } = useParams();
  const [promo, setPromo] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/promotions/${id}/`);
        setPromo(res.data);
        setName(res.data.name);
        setType(res.data.type);
        setStart(res.data.start);
        setEnd(res.data.end);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPromotion();
  }, [id]);

  const handleSave = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/promotions/${id}/`, { name, type, start, end });
      alert("Cập nhật thành công!");
      navigate("/seller-center/promotions");
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại!");
    }
  };

  if (!promo) return <p>Đang tải dữ liệu...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", background: "#fff", borderRadius: "12px" }}>
      <h2>Chỉnh sửa khuyến mãi</h2>
      <div>
        <label>Tên:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Loại:</label>
        <input value={type} onChange={(e) => setType(e.target.value)} />
      </div>
      <div>
        <label>Start:</label>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <div>
        <label>End:</label>
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <button onClick={handleSave}>Lưu</button>
      <button onClick={() => navigate(-1)}>Hủy</button>
    </div>
  );
};

export default EditPromotion;
