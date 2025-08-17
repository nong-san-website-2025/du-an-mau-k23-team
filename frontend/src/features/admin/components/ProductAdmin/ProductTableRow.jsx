import React, { useState } from "react";

const ProductTableRow = ({
  product,
  expanded,
  onExpand,
  onDelete,
  onEdit,
  getStatusBadge,
  checked,
  onCheck,
  isActive, // ✅ thêm prop để biết row nào đang active
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Hàm format tiền theo chuẩn VNĐ
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <tr
      onClick={onExpand}
      style={{
        cursor: "pointer",
        position: "relative",
        backgroundColor: isActive ? "#ff0d00ff" : "transparent", // ✅ đổi màu khi active
        transition: "background-color 0.2s ease",
      }}
    >
      <td>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            e.stopPropagation();
            onCheck();
          }}
        />
      </td>
      <td>{product.id}</td>
      <td>
        <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
          {product.image ? (
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setShowPreview(true)}
              onMouseLeave={() => setShowPreview(false)}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                  marginRight: "10px",
                  borderRadius: "4px",
                }}
              />

              {/* Preview ảnh lớn khi hover */}
              {showPreview && (
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    left: "60px",
                    padding: "5px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    boxShadow: "0px 4px 8px rgba(0,0,0,0.15)",
                    zIndex: 100,
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "contain",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#e0e0e0",
                marginRight: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "#666",
              }}
            >
              No Image
            </div>
          )}
          <span>{product.name}</span>
        </div>
      </td>
      <td>{product.category_name}</td>
      <td>{formatPrice(product.price)}</td>
      <td>{product.stock ?? 0}</td>
    </tr>
  );
};

export default ProductTableRow;
