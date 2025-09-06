import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const navigate = useNavigate();

  const fetchPromotions = () => {
    axios.get("http://127.0.0.1:8000/api/promotions/promotions/")
      .then(res => setPromotions(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa?")) return;
    axios.delete(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`)
      .then(() => {
        setPromotions(promotions.filter(p => p.id !== id));
        alert("Xóa thành công!");
      })
      .catch(err => {
        console.error(err.response?.data || err.message);
        alert("Xóa thất bại!");
      });
  };

  return (
    <div>
      <h2>Danh sách Khuyến mãi</h2>
      <button onClick={() => navigate("/seller-center/promotions/add")}>Thêm mới</button>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Tên</th>
            <th>Loại</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map(p => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>
                <button onClick={() => navigate(`/seller-center/promotions/view/${p.id}`)}>Xem</button>
                <button onClick={() => navigate(`/seller-center/promotions/edit/${p.id}`)}>Sửa</button>
                <button onClick={() => handleDelete(p.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PromotionList;
