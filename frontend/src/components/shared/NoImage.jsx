// src/components/shared/NoImage.jsx
import React from "react";

const NoImage = ({
  width = "100%", // ✅ Mặc định 100%, nhưng có thể truyền số pixel
  height = 160,
  text = "Không có hình ảnh",
  className = "",
}) => (
  <div
    className={`no-image ${className}`}
    style={{
      width: typeof width === "number" ? `${width}px` : width,
      height: `${height}px`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f5f5f5",
      color: "#999",
      fontWeight: "500",
      fontSize: 14,
      borderRadius: 8,
      border: "1px dashed #ddd",
      textAlign: "center",
      userSelect: "none",
    }}
  >
    {text}
  </div>
);

export default NoImage;
