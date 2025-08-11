import React, { useState } from "react";
import { productApi } from "../../../products/services/productApi";
import ProductTableRow from "./ProductTableRow";
import ProductDetailRow from "./ProductDetailRow";
import ProductEditForm from "./ProductEditForm";

export default function ProductTable({
  products,
  loading,
  selectedCategory,
  searchTerm,
  getStatusBadge,
  checkedIds,
  setCheckedIds,
}) {
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editProduct, setEditProduct] = useState(null); // null hoặc object sản phẩm đang sửa

  const handleExpand = (productId) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
    setEditProduct(null);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Bạn có chắc muốn xoá sản phẩm "${product.name}"?`))
      return;
    setLoadingAction(true);
    try {
      await productApi.deleteProduct(product.id);
      alert("Đã xoá sản phẩm thành công!");
      window.location.reload(); // hoặc gọi props.reloadProducts nếu có
    } catch (err) {
      alert("Xoá sản phẩm thất bại!");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const form = e.target;
      const data = {
        name: form.name.value,
        description: form.description.value,
        price: form.price.value,
        stock: form.stock.value,
        status: form.status.value,
      };
      await productApi.updateProduct(editProduct.id, data);
      alert("Cập nhật sản phẩm thành công!");
      setEditProduct(null);
      window.location.reload(); // hoặc gọi props.reloadProducts nếu có
    } catch (err) {
      alert("Cập nhật thất bại!");
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter((product) => {
    let productCategoryId;
    if (product.category && typeof product.category === "object") {
      productCategoryId = product.category.id;
    } else if (product.category_id) {
      productCategoryId = product.category_id;
    } else if (product.category && typeof product.category === "number") {
      productCategoryId = product.category;
    } else {
      productCategoryId = null;
    }
    const categoryMatch = selectedCategory === "all" || productCategoryId === Number(selectedCategory);
    const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  return (
    <div className="table-responsive" style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <table className="table table-hover" style={{ margin: 0 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th className="border-0 text-3 py-0" style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: "26px", fontWeight: "normal" }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={products.length > 0 && checkedIds.length === filteredProducts.length}
                onChange={e => {
                  const visibleIds = filteredProducts.map(p => p.id);
                  if (e.target.checked) {
                    setCheckedIds(Array.from(new Set([...checkedIds, ...visibleIds])));
                  } else {
                    setCheckedIds(checkedIds.filter(id => !visibleIds.includes(id)));
                  }
                }}
              />
            </th>
            <th className="border-0 text-3 py-0" style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: "26px", fontSize: "12px", fontWeight: "500", paddingLeft: "76px" }}>Sản phẩm</th>
            <th className="border-0 text-3 py-0" style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: "26px", fontSize: "12px", fontWeight: "500" }}>Danh mục</th>
            <th className="border-0 text-3 py-0" style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: "26px", fontSize: "12px", fontWeight: "500" }}>Giá (VNĐ)</th>
            <th className="border-0 text-3 py-0" style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: "26px", fontSize: "12px", fontWeight: "500" }}>Tồn kho</th>
            <th className="border-0 text-3 py-0" style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: "26px", fontSize: "12px", fontWeight: "500" }}>Trạng thái</th>
            <th className="border-0 text-muted py-0" style={{ position: "sticky", top: 0, zIndex: 5, background: "#fff", height: "26px", fontSize: "12px", fontWeight: "500" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="text-center text-muted">Đang tải dữ liệu...</td>
            </tr>
          ) : filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted">Không có sản phẩm</td>
            </tr>
          ) : (
            filteredProducts.map(product => (
              <React.Fragment key={product.id}>
                <ProductTableRow
                  product={product}
                  checked={checkedIds.includes(product.id)}
                  onCheck={e => {
                    if (e.target.checked) {
                      setCheckedIds([...checkedIds, product.id]);
                    } else {
                      setCheckedIds(checkedIds.filter(id => id !== product.id));
                    }
                  }}
                  onExpand={() => handleExpand(product.id)}
                  getStatusBadge={getStatusBadge}
                  isExpanded={expandedProductId === product.id}
                />
                {expandedProductId === product.id && (
                  <ProductDetailRow
                    product={product}
                    getStatusBadge={getStatusBadge}
                    onEdit={() => handleEdit(product)}
                    onDelete={() => handleDelete(product)}
                    loadingAction={loadingAction}
                    isEditing={editProduct && editProduct.id === product.id}
                  >
                    {editProduct && editProduct.id === product.id && (
                      <ProductEditForm
                        editProduct={editProduct}
                        loadingAction={loadingAction}
                        onSubmit={handleEditSubmit}
                        onCancel={() => setEditProduct(null)}
                      />
                    )}
                  </ProductDetailRow>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
    

