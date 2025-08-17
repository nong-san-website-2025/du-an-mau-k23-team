import { useEffect, useState } from "react";
import { Search, Import, FileUp, HelpCircle, Plus } from "lucide-react";
import AdminPageLayout from "../components/AdminPageLayout";
import AdminHeader from "../components/AdminHeader";
import ProductSidebar from "../components/ProductAdmin/ProductSideBar";
import ProductTable from "../components/ProductAdmin/ProductTable";
import ProductTableActions from "../components/ProductAdmin/ProductTableActions";
import ProductAddModal from "../components/ProductAdmin/ProductAddModal";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/products/");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setProducts(data);

      // Lấy category duy nhất từ data
      const unique = {};
      data.forEach((prod) => {
        if (prod.category_id && prod.category_name) {
          unique[prod.category_id] = prod.category_name;
        }
      });

      const mapped = Object.entries(unique).map(([value, label]) => ({
        value: Number(value),
        label,
      }));

      // Giữ lại "Tất cả loại hàng" ở đầu
      setCategories([...mapped]);
    } catch (err) {
      console.error("Lỗi khi fetch products:", err);
      setProducts([]);
      setCategories([{ value: "all", label: "Tất cả loại hàng" }]);
    } finally {
      setLoading(false);
    }
  };

  // Lọc sản phẩm theo category + search
  const filteredProducts = products.filter((prod) => {
    const matchCategory =
      selectedCategory === "all" ||
      String(prod.category_id) === String(selectedCategory);

    const matchSearch =
      searchTerm.trim() === "" ||
      prod.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchCategory && matchSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const renderActionButtons = () => {
    if (checkedIds.length > 0) {
      return (
        <button
          className="btn btn-danger border"
          style={{ fontWeight: "500" }}
          title="Xoá sản phẩm đã chọn"
          onClick={() => {
            if (
              window.confirm(
                `Bạn có chắc muốn xoá ${checkedIds.length} sản phẩm đã chọn?`
              )
            ) {
              // TODO: Gọi API xoá nhiều sản phẩm với checkedIds
              alert("Đã gọi xoá các sản phẩm: " + checkedIds.join(", "));
            }
          }}
        >
          <i
            className="bi bi-trash"
            style={{ fontSize: 16, marginRight: 6 }}
          ></i>
          Xoá ({checkedIds.length})
        </button>
      );
    }

    return (
      <>
        <button
          className="btn btn-light border"
          style={{ fontWeight: "500", color: "#48474b" }}
        >
          <Import size={16} /> &ensp; Nhập file
        </button>
        <button
          className="btn btn-light border"
          style={{ fontWeight: "500", color: "#48474b" }}
        >
          <FileUp size={16} /> &ensp; Xuất file
        </button>
        <button
          className="btn btn-light border"
          style={{ fontWeight: "500", color: "#48474b" }}
        >
          <HelpCircle size={16} />
        </button>
        <button
          className="btn d-flex align-items-center"
          style={{
            backgroundColor: "#22C55E",
            color: "#fff",
            fontWeight: "600",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
          }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} className="me-0" /> Tạo mới
        </button>
      </>
    );
  };

  return (
    <AdminPageLayout
      header={<AdminHeader />}
      sidebar={
        <ProductSidebar
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
            {/* Thanh tìm kiếm */}
            <div style={{ flex: 1 }}>
              <div className="input-group" style={{ width: 420 }}>
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Action buttons */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
              {checkedIds.length > 0 && (
                <span
                  className="badge bg-primary"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  Đã chọn: {checkedIds.length}
                </span>
              )}
              {renderActionButtons()}
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="p-1">
          <ProductTable
            products={paginatedProducts}
            loading={loading}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            getStatusBadge={getStatusBadge}
            ProductTableActions={ProductTableActions}
            checkedIds={checkedIds}
            setCheckedIds={setCheckedIds}
            reloadProducts={fetchProducts}
          />
          <ProductAddModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={fetchProducts}
          />

          {/* Pagination */}
          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} /
              {filteredProducts.length} sản phẩm
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Trước
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li
                    key={i}
                    className={`page-item ${
                      currentPage === i + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
