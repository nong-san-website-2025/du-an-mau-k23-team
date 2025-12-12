// src/components/shared/NoImage.jsx
import React from "react";

const NoImage = ({
  width = "100%",
  height = 160,
  text = "Không có hình ảnh",
  className = "",
}) => (
  <div
    className={`no-image ${className}`}
    style={{
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#dfdfdf",
      color: "#808080",
      fontWeight: "500",
      fontSize: 14,
      borderRadius: 8,
      textAlign: "center",
      userSelect: "none",
    }}
  >
    {text}
  </div>
);

export default NoImage;
