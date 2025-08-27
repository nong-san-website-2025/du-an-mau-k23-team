import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, HelpCircle, Plus } from "lucide-react";
import AdminPageLayout from "../components/AdminPageLayout";
import ProductFilterSidebar from "../components/ProductAdmin/ProductSideBar";
import ProductTable from "../components/ProductAdmin/ProductTable";
import ProductTableActions from "../components/ProductAdmin/ProductTableActions";
import ProductAddModal from "../components/ProductAdmin/ProductAddModal";

const API_URL = process.env.REACT_APP_API_URL; // ví dụ: "http://localhost:8000/api"

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([{ value: "all", label: "Tất cả loại hàng" }]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/products/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setProducts(data);

      const unique = {};
      data.forEach((prod) => {
        if (prod.category_id && prod.category_name) {
          unique[prod.category_id] = prod.category_name;
        }
      });
      const mapped = Object.entries(unique).map(([value, label]) => ({ value: Number(value), label }));
      setCategories([{ value: "all", label: "Tất cả loại hàng" }, ...mapped]);
    } catch (err) {
      console.error("Lỗi khi fetch products:", err);
      setProducts([]);
      setCategories([{ value: "all", label: "Tất cả loại hàng" }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCount = useMemo(() => {
    return products.filter((p) => {
      const byKeyword = !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const byCategory = selectedCategory === "all" || String(p.category_id) === String(selectedCategory);
      return byKeyword && byCategory;
    }).length;
  }, [products, searchTerm, selectedCategory]);

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
            if (window.confirm(`Bạn có chắc muốn xoá ${checkedIds.length} sản phẩm đã chọn?`)) {
              alert("Đã gọi xoá các sản phẩm: " + checkedIds.join(", "));
            }
          }}
        >
          <i className="bi bi-trash" style={{ fontSize: 16, marginRight: 6 }}></i>
          Xoá ({checkedIds.length})
        </button>
      );
    }

    return (
      <>
        <button className="btn btn-light border" style={{ fontWeight: "500", color: "#48474b" }}>
          <HelpCircle size={16} />
        </button>
        <button
          className="btn d-flex align-items-center"
          style={{ backgroundColor: "#22C55E", color: "#fff", fontWeight: "600", padding: "6px 20px", borderRadius: "8px", border: "none" }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} className="me-2" /> Thêm sản phẩm
        </button>
      </>
    );
  };

  return (
    <AdminPageLayout sidebar={null}>
      <ProductFilterSidebar
        variant="top"
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        onCategoryCreated={fetchProducts}
      />
      <div className="bg-white" style={{ minHeight: "100vh" }}>
        <div className="p-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-0 gap-2 flex-wrap">
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
            <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-md-0">
              {checkedIds.length > 0 && (
                <span className="badge bg-primary" style={{ fontSize: 14, fontWeight: 500 }}>
                  Đã chọn: {checkedIds.length}
                </span>
              )}
              {renderActionButtons()}
            </div>
          </div>
        </div>

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
            reloadProducts={fetchProducts}
          />

          <AnimatePresence>
            {showAddModal && (
              <ProductAddModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchProducts}
              />
            )}
          </AnimatePresence>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">Hiển thị {filteredCount} sản phẩm</div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}