import React from "react";

export default function CategoryCard({ title, image, onClick }) {
  const fallback = "/assets/logo/imagelogo.png"; // ảnh mặc định nếu thiếu ảnh

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center p-0 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-white"
    >
      <div className="w-20 h-20 mb-2 flex items-center justify-center overflow-hidden rounded-full bg-gray-50">
        <img
          src={image || fallback}
          alt={title}
          className="object-cover"
          style={{ width: "20%", height: "20%" }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 text-center">{title}</span>
    </div>
  );
}
