import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProductTableRow from "./ProductTableRow";
import ProductDetailRow from "./ProductDetailRow";
import { productApi } from "../../../products/services/productApi";
import ProductAddModal from "./ProductAddModal";
import ProductEditModal from "./ProductEditModal";

export default function ProductTable({
  products,
  loading,
  selectedCategory,
  searchTerm,
  getStatusBadge,
  checkedIds,
  setCheckedIds,
  reloadProducts,
}) {
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [activeRowId, setActiveRowId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleExpand = (productId) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
    setActiveRowId(productId === activeRowId ? null : productId);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Bạn có chắc muốn xoá sản phẩm "${product.name}"?`)) return;
    setLoadingAction(true);
    try {
      await productApi.deleteProduct(product.id);
      alert("Đã xoá sản phẩm thành công!");
      if (reloadProducts) reloadProducts();
      else window.location.reload();
    } catch (err) {
      alert("Xoá sản phẩm thất bại!");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowEditModal(true);
  };

  const handleAddSuccess = () => {
    if (reloadProducts) reloadProducts();
    else window.location.reload();
  };

  const handleEditSuccess = () => {
    if (reloadProducts) reloadProducts();
    else window.location.reload();
  };

  const filtered = products.filter((p) => {
    const byKeyword = !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const byCategory = selectedCategory === "all" || String(p.category_id) === String(selectedCategory);
    return byKeyword && byCategory;
  });

  return (
    <>
      <div className="table-responsive rounded border">
        <table className="table align-middle m-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: 44 }}>
                <input
                  type="checkbox"
                  checked={checkedIds.length === filtered.length && filtered.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setCheckedIds(filtered.map((p) => p.id));
                    else setCheckedIds([]);
                  }}
                />
              </th>
              <th style={{ width: 110 }}>Mã sản phẩm</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th style={{ width: 150 }}>Giá</th>
              <th style={{ width: 110 }}>Tồn kho</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.map((product) => (
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
                    isActive={activeRowId === product.id}
                  />
                  {expandedProductId === product.id && (
                    <ProductDetailRow
                      product={product}
                      getStatusBadge={getStatusBadge}
                      onEdit={() => handleEdit(product)}
                      onDelete={() => handleDelete(product)}
                      loadingAction={loadingAction}
                      isEditing={false}
                    />
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    {loading ? "Đang tải..." : "Không có sản phẩm phù hợp"}
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <ProductEditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={editProduct}
        onSuccess={handleEditSuccess}
      />

      <ProductAddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </>
  );
}