import React, { useState } from "react";

import ProductTableRow from "./ProductTableRow";
import ProductDetailRow from "./ProductDetailRow";
import ProductEditForm from "./ProductEditForm";
import { productApi } from "../../../products/services/productApi";
import ProductAddModal from "./ProductAddModal";

export default function ProductTable({
  products,
  loading,
  selectedCategory,
  searchTerm,
  getStatusBadge,
  checkedIds,
  setCheckedIds,
  reloadProducts, // optional prop nếu muốn reload sau khi thêm
}) {
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editProduct, setEditProduct] = useState(null); // null hoặc object sản phẩm đang sửa
  const [showAddModal, setShowAddModal] = useState(false);

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

  // Thêm sản phẩm thành công thì reload
  const handleAddSuccess = () => {
    if (reloadProducts) reloadProducts();
    else window.location.reload();
  };

  // ...existing code...

  return (
    <>
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={checkedIds.length === products.length && products.length > 0}
                onChange={(e) => {
                  if (e.target.checked) setCheckedIds(products.map((p) => p.id));
                  else setCheckedIds([]);
                }}
              />
            </th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <React.Fragment key={product.id}>
              <ProductTableRow
                product={product}
                expanded={expandedProductId === product.id}
                onExpand={() => handleExpand(product.id)}
                onDelete={() => handleDelete(product)}
                onEdit={() => handleEdit(product)}
                getStatusBadge={getStatusBadge}
                checked={checkedIds.includes(product.id)}
                onCheck={() => {
                  if (checkedIds.includes(product.id))
                    setCheckedIds(checkedIds.filter((id) => id !== product.id));
                  else setCheckedIds([...checkedIds, product.id]);
                }}
              />
              {expandedProductId === product.id && !editProduct && (
                <ProductDetailRow 
                  product={product}
                  getStatusBadge={getStatusBadge}
                  onEdit={() => handleEdit(product)}
                  onDelete={() => handleDelete(product)}
                  loadingAction={loadingAction}
                  isEditing={editProduct && editProduct.id === product.id}
                />
              )}
              {expandedProductId === product.id && editProduct && (
                <ProductEditForm
                  product={editProduct}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setEditProduct(null)}
                />
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <ProductAddModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
    </>
  );
}