import React, { useState, useEffect } from "react";
import { Search, Plus, Import, FileUp, HelpCircle } from "lucide-react";
import AdminPageLayout from "../components/AdminPageLayout";
import AdminHeader from "../components/AdminHeader";
import ProductFilterSidebar from "../components/ProductAdmin/ProductSideBar";
import ProductTable from "../components/ProductAdmin/ProductTable";
import ProductTableActions from "../components/ProductAdmin/ProductTableActions";
import AddProductModal from "../components/ProductAdmin/AddProductModal";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([
    { value: "all", label: "Tất cả loại hàng" },
  ]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  // Bỏ logic lọc ở đây, để ProductTable tự xử lý
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products/");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setProducts(data);

      // Tạo danh sách category duy nhất từ data
      const unique = {};
      data.forEach((prod) => {
        if (prod.category_id && prod.category_name) {
          unique[prod.category_id] = prod.category_name;
        }
      });

      const mapped = [
        ...Object.entries(unique).map(([value, label]) => ({
          value: Number(value),
          label,
        })),
      ];

      setCategories(mapped);
    } catch (err) {
      console.error("Lỗi khi fetch products:", err);
      setProducts([]);
      setCategories([{ value: "all", label: "Tất cả loại hàng" }]);
    } finally {
      setLoading(false);
    }
  };

  // Đã loại bỏ fetchCategories, chỉ lấy category từ products

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-pill text-white fw-bold";
    switch (status) {
      case "Đã duyệt":
        return `${baseClasses} bg-success`;
      case "Chờ duyệt":
        return `${baseClasses} bg-warning`;
      case "Bị từ chối":
        return `${baseClasses} bg-danger`;
      default:
        return `${baseClasses} bg-secondary`;
    }
  };

  return (
    <AdminPageLayout
      header={<AdminHeader />}
      sidebar={
        <ProductFilterSidebar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          onCategoryCreated={fetchProducts}
        />
      }
    >
      <div className="bg-white" style={{ minHeight: "100vh" }}>
        {/* Header Section */}
        <div className="p-2 border-bottom">
            <div className="d-flex justify-content-between align-items-center mb-0 gap-2 flex-wrap">
              {/* Thanh tìm kiếm bên trái */}
              <div style={{ flex: 1 }}>
                <div className="input-group" style={{ width: 420 }}>
                  <span className="input-group-text bg-white border-end-0">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 "
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderLeft: 0 }}
                  />
                </div>
              </div>
              {/* Số lượng đã chọn */}
              <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
                {checkedIds.length > 0 && (
                  <span className="badge bg-primary" style={{fontSize:14, fontWeight:500}}>
                    Đã chọn: {checkedIds.length}
                  </span>
                )}
                  {checkedIds.length > 0 ? (
                    <button
                      className="btn btn-danger border"
                      style={{ fontWeight: "500" }}
                      title="Xoá sản phẩm đã chọn"
                      onClick={() => {
                        if(window.confirm(`Bạn có chắc muốn xoá ${checkedIds.length} sản phẩm đã chọn?`)){
                          // Gọi API xoá ở đây
                          alert('Đã gọi xoá các sản phẩm: ' + checkedIds.join(", "));
                        }
                      }}
                    >
                      <i className="bi bi-trash" style={{fontSize:16, marginRight:6}}></i>
                      Xoá ({checkedIds.length})
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-light border"
                        style={{ fontWeight: "500", color: "#48474b" }}
                        title="Nhập file"
                      >
                        <Import size={16} />
                        &ensp; Nhập file
                      </button>
                      <button
                        className="btn btn-light border"
                        style={{ fontWeight: "500", color: "#48474b" }}
                        title="Xuất file"
                      >
                        <FileUp size={16} />
                        &ensp; Xuất file
                      </button>
                      <button
                        className="btn btn-light border"
                        style={{ fontWeight: "500", color: "#48474b" }}
                        title="Hướng dẫn sử dụng"
                      >
                        <HelpCircle size={16} />
                      </button>
                      <button
                        className="btn d-flex align-items-center"
                        style={{
                          backgroundColor: "#22C55E",
                          color: "#fff",
                          fontWeight: "600",
                          padding: "6px 20px",
                          borderRadius: "8px",
                          border: "none",
                        }}
                        onClick={() => {
                          setEditingProduct(null);
                          setShowAddModal(true);
                        }}
                      >
                        <Plus size={20} className="me-2 " style={{fontSize:16}} />
                        Thêm sản phẩm
                      </button>
                    </>
                  )}
            </div>
          </div>
        </div>
        {/* Product Table */}
        <div className="p-1">
          <ProductTable
            products={products}
            loading={loading}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            getStatusBadge={getStatusBadge}
            ProductTableActions={ProductTableActions}
            checkedIds={checkedIds}
            setCheckedIds={setCheckedIds}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setShowAddModal(true);
            }}
          />
          {/* Pagination giữ nguyên */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
              Hiển thị 1-5 trong tổng số 25 sản phẩm
            </div>
            <nav aria-label="Pagination">
              <ul className="pagination mb-0">
                <li className="page-item disabled">
                  <span className="page-link">Trước</span>
                </li>
                <li className="page-item active">
                  <span
                    className="page-link"
                    style={{
                      backgroundColor: "#22C55E",
                      borderColor: "#22C55E",
                    }}
                  >
                    1
                  </span>
                </li>
                <li className="page-item">
                  <a
                    className="page-link"
                    href="#"
                    style={{ color: "#22C55E" }}
                  >
                    2
                  </a>
                </li>
                <li className="page-item">
                  <a
                    className="page-link"
                    href="#"
                    style={{ color: "#22C55E" }}
                  >
                    3
                  </a>
                </li>
                <li className="page-item">
                  <a
                    className="page-link"
                    href="#"
                    style={{ color: "#22C55E" }}
                  >
                    Sau
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        {/* Modal thêm sản phẩm */}
        <AddProductModal
          visible={showAddModal}
          onCancel={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingProduct(null);
            fetchProducts();
          }}
          product={editingProduct}
        />
      </div>
    </AdminPageLayout>
  );
}
