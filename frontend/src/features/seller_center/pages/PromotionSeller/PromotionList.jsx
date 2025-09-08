import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const navigate = useNavigate();

  const fetchPromotions = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/promotions/promotions/");
      setPromotions(res.data);
    } catch (err) {
      console.error(err);
      alert("Lấy dữ liệu thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa không?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`);
      setPromotions(promotions.filter((p) => p.id !== id)); // cập nhật trực tiếp trên React
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại");
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return (
    <div>
      <h2>Danh sách Khuyến mãi</h2>
      <button onClick={() => navigate("/seller-center/promotions/add")}>
        Thêm mới
      </button>
      <table border={1} cellPadding={8} cellSpacing={0}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Mã</th>
            <th>Tên</th>
            <th>Loại</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promo) => (
            <tr key={promo.id}>
              <td>{promo.id}</td>
              <td>{promo.code}</td>
              <td>{promo.name}</td>
              <td>{promo.type}</td>
              <td>
                <button onClick={() => navigate(`/seller-center/promotions/view/${promo.id}`)}>Xem</button>
                <button onClick={() => navigate(`/seller-center/promotions/edit/${promo.id}`)}>Sửa</button>
                <button onClick={() => handleDelete(promo.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PromotionList;
