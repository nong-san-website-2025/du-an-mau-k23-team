import React from "react";

export default function ProductDetailRow({ product, getStatusBadge, onEdit, onDelete, loadingAction, isEditing, children }) {
  return (
    <tr>
      <td colSpan={7} style={{ background: isEditing ? "#e0f2fe" : "#f8fafc", borderBottom: "1px solid #e5e7eb", padding: 0 }}>
        <div style={{ display: "flex", flexDirection: "row", gap: 32, padding: 24, alignItems: "flex-start", flexWrap: "nowrap" }}>
          {/* Ảnh bên trái */}
          <div style={{ minWidth: 180, maxWidth: 220, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <img src={product.image} alt={product.name} style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid #eee' }} />
          </div>
          {/* Thông tin bên phải */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{product.name}</div>
            <div style={{ marginBottom: 8, color: '#666' }}><b>Danh mục:</b> {product.category && typeof product.category === 'object' ? product.category.name : product.category_name || ''}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
              <div><b>Giá:</b> {Number(product.price).toLocaleString('vi-VN')} VNĐ</div>
              <div><b>Tồn kho:</b> {product.stock}</div>
              <div><b>Trạng thái:</b> <span className={getStatusBadge(product.status)}>{product.status}</span></div>
            </div>
            <div style={{ marginTop: 8 }}><b>Mô tả:</b> {product.description}</div>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-primary" disabled={loadingAction} onClick={onEdit}>
                <i className="bi bi-pencil-square">&nbsp;</i>{loadingAction ? 'Đang xử lý...' : 'Chỉnh sửa'}
              </button>
              <button className="btn btn-danger" disabled={loadingAction} onClick={onDelete}>
                <i className="bi bi-trash">&nbsp;</i>{loadingAction ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
            {children}
          </div>
        </div>
      </td>
    </tr>
  );
}
