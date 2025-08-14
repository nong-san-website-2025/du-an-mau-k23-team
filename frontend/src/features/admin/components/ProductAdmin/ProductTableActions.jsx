import React from "react";


export default function ProductTableActions({ product }) {
  // You can add handlers for each action if needed
  return (
    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-outline-primary"
        title="Xem chi tiết"
        style={{ width: "32px", height: "32px", padding: "0" }}
      >
        {/* Eye icon */}
        <i className="bi bi-eye"></i>
      </button>
      <button
        className="btn btn-sm btn-outline-success"
        title="Chỉnh sửa"
        style={{ width: "32px", height: "32px", padding: "0" }}
      >
        {/* Edit icon */}
        <i className="bi bi-pencil"></i>
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        title="Xóa"
        style={{ width: "32px", height: "32px", padding: "0" }}
      >
        {/* Trash icon */}
        <i className="bi bi-trash"></i>
      </button>
      <button
        className="btn btn-sm btn-outline-secondary"
        title="Thêm"
        style={{ width: "32px", height: "32px", padding: "0" }}
      >
        {/* More icon */}
        <i className="bi bi-three-dots-vertical"></i>
      </button>
    </div>
  );
}
