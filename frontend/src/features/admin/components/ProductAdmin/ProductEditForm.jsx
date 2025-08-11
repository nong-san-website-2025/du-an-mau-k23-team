import React from "react";

export default function ProductEditForm({ editProduct, loadingAction, onSubmit, onCancel }) {
  if (!editProduct) return null;
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "#fff",
        borderTop: "1px solid #e5e7eb",
        padding: 24,
        marginTop: 0,
        display: "flex",
        gap: 32,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 220, flex: 1 }}>
        <label className="form-label">Tên sản phẩm</label>
        <input name="name" className="form-control" defaultValue={editProduct.name} required />
      </div>
      <div style={{ minWidth: 220, flex: 1 }}>
        <label className="form-label">Giá</label>
        <input name="price" className="form-control" type="number" defaultValue={editProduct.price} required />
      </div>
      <div style={{ minWidth: 220, flex: 1 }}>
        <label className="form-label">Tồn kho</label>
        <input name="stock" className="form-control" type="number" defaultValue={editProduct.stock} required />
      </div>
      <div style={{ minWidth: 300, flex: 2 }}>
        <label className="form-label">Mô tả</label>
        <textarea name="description" className="form-control" defaultValue={editProduct.description} rows={2} />
      </div>
      <div style={{ minWidth: 220, flex: 1 }}>
        <label className="form-label">Trạng thái</label>
        <select name="status" className="form-select" defaultValue={editProduct.status} required>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </div>
      <div style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "end" }}>
        <button className="btn btn-success" type="submit" disabled={loadingAction}>
          {loadingAction ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button className="btn btn-secondary mt-2" type="button" onClick={onCancel}>
          Huỷ
        </button>
      </div>
    </form>
  );
}
