import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../features/admin/services/axiosInstance.js";

export default function SearchResultsPage() {
  const navigate = useNavigate();

  const location = useLocation();
  const [results, setResults] = useState({
    products: [],
    posts: [],
    sellers: [], // đổi từ shops → sellers
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    category: "",
    priceMin: "",
    priceMax: "",
  });

  const query = new URLSearchParams(location.search).get("query");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const res = await axiosInstance.get(`/products/search/`, {
          params: { q: query },
        });

        setResults({
          products: res.data.products || [],
          posts: res.data.posts || [],
          sellers: res.data.sellers || [],
        });
      } catch (err) {
        console.error("Lỗi khi tải kết quả tìm kiếm:", err);
        setError("Không thể tải kết quả tìm kiếm.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    console.log("Filter applied:", filters);
    // Tại đây có thể filter tại client hoặc gọi API backend
  };

  return (
    <div className="container mt-4">
      <h2>Kết quả tìm kiếm cho: "{query}"</h2>

      {loading && <p>Đang tải kết quả...</p>}
      {error && <p className="text-danger">{error}</p>}

      <div className="row mt-4">
        {/* Sidebar filter */}
        <div className="col-md-3">
          <div className="p-3 border rounded shadow-sm bg-light">
            <h5 className="mb-3">Bộ lọc</h5>

            <div className="mb-3">
              <label className="form-label">Danh mục</label>
              <select
                name="category"
                className="form-select"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả</option>
                <option value="fruits">Trái cây</option>
                <option value="vegetables">Rau củ</option>
                <option value="meat">Thịt</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Khoảng giá</label>
              <div className="d-flex">
                <input
                  type="number"
                  name="priceMin"
                  placeholder="Từ"
                  className="form-control me-2"
                  value={filters.priceMin}
                  onChange={handleFilterChange}
                />
                <input
                  type="number"
                  name="priceMax"
                  placeholder="Đến"
                  className="form-control"
                  value={filters.priceMax}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <button className="btn btn-success w-100" onClick={applyFilters}>
              Áp dụng
            </button>
          </div>
        </div>

        {/* Kết quả tìm kiếm */}
        <div className="col-md-9">
          {/* Sellers */}
          <div className="row">
            {results.sellers?.map((seller) => (
              <div
                className="col-md-3 mb-3"
                key={seller.id}
                onClick={() => navigate(`/store/${seller.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="card h-100 shadow-sm">
                  <div className="card-body text-center">
                    <h5 className="card-title">{seller.store_name}</h5>
                    <p className="card-text text-muted">
                      {seller.description?.slice(0, 50)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Products */}
          <div className="row">
            {results.products?.map((product) => (
              <div
                className="col-md-3 mb-3"
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="card h-100 shadow-sm">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="card-img-top"
                    style={{ height: 150, objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text text-danger fw-bold">
                      {product.price?.toLocaleString()} đ
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
