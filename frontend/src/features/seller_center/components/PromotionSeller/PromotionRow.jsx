import React, { useState, useRef, useEffect } from "react";
import styles from "./PromotionsDropdownTable.module.css";
import axios from "axios";

function PromotionRow({ promo, status, onEdit, onView, setPromotions }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${promo.name}"?`)) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/promotions/${promo.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
      alert("Xóa thành công!");
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại!");
    }
  };

  return (
    <tr>
      <td className={styles.tdContent} style={{ textAlign: "center" }}>{promo.id}</td>
      <td className={styles.tdContent} style={{ textAlign: "center" }}>{promo.code}</td>
      <td className={styles.tdContent}>{promo.name}</td>
      <td className={styles.tdContent}>
        {promo.type === "Promotion" ? "Giảm tiền" : promo.type === "Flash Sale" ? "Giảm %" : "Freeship"}
      </td>
      <td className={styles.tdContent}>{promo.condition || "-"}</td>
      <td className={styles.tdContent} style={{ textAlign: "center" }}>{promo.start ? new Date(promo.start).toLocaleDateString() : "-"}</td>
      <td className={styles.tdContent} style={{ textAlign: "center" }}>{promo.end ? new Date(promo.end).toLocaleDateString() : "-"}</td>
      <td className={styles.tdContent} style={{ textAlign: "center" }}>
        <span style={{
          padding: "2px 12px",
          borderRadius: "6px",
          fontWeight: 500,
          color: status === "Đang chạy" ? "#27ae60" : status === "Sắp diễn ra" ? "#f39c12" : "#7f8c8d",
          background: status === "Đang chạy" ? "#eafaf1" : status === "Sắp diễn ra" ? "#fff6e0" : "#f9f9f9",
          fontSize: "0.78rem"
        }}>{status}</span>
      </td>
      <td className={styles.tdContent} style={{ textAlign: "center" }}>{promo.used} / {promo.total}</td>
      <td className={styles.tdContent} style={{ textAlign: "center" }}>{promo.products || 0}</td>
      <td className={styles.tdContent} style={{ textAlign: "center", position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            background: "#f4f6fb",
            border: "1px solid #e5e9f2",
            borderRadius: "50%",
            fontSize: "1.15rem",
            cursor: "pointer",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#222",
          }}
        >⋮</button>
        {dropdownOpen && (
          <div
            className={styles.dropdownMenu}
            style={{
              position: "absolute",
              top: 36,
              right: window.innerWidth - dropdownRef.current?.getBoundingClientRect().right < 160 ? 'auto' : 0,
              left: window.innerWidth - dropdownRef.current?.getBoundingClientRect().right < 160 ? 0 : 'auto',
              background: "#fff",
              boxShadow: "0 4px 16px rgba(44,62,80,0.18)",
              minWidth: "120px",
              zIndex: 2000,
              borderRadius: "10px",
              overflow: "hidden",
              fontSize: "0.93rem",
              border: "1px solid #e5e9f2",
              fontWeight: 500,
              padding: 0
            }}
          >
            <div onClick={() => { setDropdownOpen(false); onEdit(promo); }} className={styles.dropdownItem}>Sửa</div>
            <div onClick={() => { setDropdownOpen(false); handleDelete(); }} className={styles.dropdownItem}>Xóa</div>
            <div onClick={() => { setDropdownOpen(false); onView(promo); }} className={styles.dropdownItem}>Xem chi tiết</div>
          </div>
        )}
      </td>
    </tr>
  );
}

export default PromotionRow;
