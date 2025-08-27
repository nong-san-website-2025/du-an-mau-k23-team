import React, { useState } from "react";
import { motion } from "framer-motion";

const ProductTableRow = ({
  product,
  expanded,
  onExpand,
  onDelete,
  onEdit,
  getStatusBadge,
  checked,
  onCheck,
  isActive,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.tr
      onClick={onExpand}
      initial={false}
      animate={{ backgroundColor: isActive ? "#fff7ed" : "#ffffff" }}
      transition={{ duration: 0.2 }}
      style={{ cursor: "pointer", position: "relative" }}
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
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  marginRight: 10,
                  borderRadius: 6,
                  border: "1px solid #eee",
                }}
              />

              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{
                    position: "absolute",
                    top: -20,
                    left: 60,
                    padding: 6,
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    boxShadow: "0px 6px 16px rgba(0,0,0,0.15)",
                    zIndex: 100,
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: 220, height: 220, objectFit: "contain", borderRadius: 8 }}
                  />
                </motion.div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#f3f4f6",
                marginRight: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#666",
                borderRadius: 6,
                border: "1px dashed #ddd",
              }}
            >
              No Image
            </div>
          )}
          <span className="fw-semibold">{product.name}</span>
        </div>
      </td>
      <td>{product.category_name}</td>
      <td>{formatPrice(product.price)}</td>
      <td>{product.stock ?? 0}</td>
    </motion.tr>
  );
};

export default ProductTableRow;