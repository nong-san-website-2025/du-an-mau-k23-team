import React from "react";
import "../ProductAdmin/styles/ProductTableRow.css"; // ✅ nhớ import file CSS mới

export default function ProductTableRow({ product, checked, onCheck, onExpand, getStatusBadge, isExpanded }) {
  return (
    <tr
      className={`product-row ${isExpanded ? "expanded" : ""}`}
      onClick={onExpand}
    >
      <td className="border-0 py-3">
        <input
          type="checkbox"
          className="form-check-input"
          checked={checked}
          onClick={e => e.stopPropagation()}
          onChange={onCheck}
        />
      </td>
      <td className="border-0 py-3">
        <div className="d-flex align-items-center">
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={product.image}
              alt={product.name}
              className="rounded"
              style={{ width: "30px", height: "30px", objectFit: "cover", cursor: "pointer" }}
              onMouseEnter={e => { const popup = e.currentTarget.nextSibling; if (popup) popup.style.display = "block"; }}
              onMouseLeave={e => { const popup = e.currentTarget.nextSibling; if (popup) popup.style.display = "none"; }}
              onClick={e => e.stopPropagation()}
            />
            <div className="product-image-popup" style={{
              display: "none",
              position: "absolute",
              left: "110%",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 100,
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              padding: 6
            }}>
              <img src={product.image} alt={product.name} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }} />
            </div>
          </div>
          <div className="ms-3">
            <h6 className="mb-1 fw-normal" style={{ fontSize: 14 }}>{product.name}</h6>
            <p className="text-muted mb-0 small">{product.description}</p>
          </div>
        </div>
      </td>
      <td className="border-0 py-3">
        <span className="badge bg-light text-dark px-3 py-2">
          {product.category && typeof product.category === "object" ? product.category.name : product.category_name || ""}
        </span>
      </td>
      <td className="border-0 py-3 fw-bold">{Number(product.price).toLocaleString("vi-VN")}</td>
      <td className="border-0 py-3">
        <span className={product.stock > 100 ? "text-success" : product.stock > 50 ? "text-warning" : "text-danger"}>
          {product.stock}
        </span>
      </td>
      <td className="border-0 py-3">
        <span className={getStatusBadge(product.status)}>{product.status}</span>
      </td>
      <td className="border-0 py-3">
        <div className="d-flex gap-2"></div>
      </td>
    </tr>
  );
}
