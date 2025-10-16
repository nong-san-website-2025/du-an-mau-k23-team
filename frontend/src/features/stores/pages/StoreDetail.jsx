// src/components/StoreDetail/StoreDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import { message, Pagination } from "antd";

import StoreHeader from "../components/StoreDetail/StoreHeder";
import VoucherSection from "../components/StoreDetail/VoucherSection";
import ProductSearchBar from "../components/StoreDetail/ProductSearchBar";
import ProductGrid from "../components/StoreDetail/ProductGrid";

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 18;

  // Tính lại khi products, searchQuery hoặc currentPage thay đổi
  const { filteredProducts, totalPages, paginatedProducts } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;

    const total = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
    const paginated = filtered.slice(
      (currentPage - 1) * PRODUCTS_PER_PAGE,
      currentPage * PRODUCTS_PER_PAGE
    );

    return {
      filteredProducts: filtered,
      totalPages: total,
      paginatedProducts: paginated,
    };
  }, [products, searchQuery, currentPage]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // ← quan trọng!
  };

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        const storeRes = await axios.get(
          `http://localhost:8000/api/sellers/${id}/`,
          {
            headers: authHeader,
          }
        );
        setStore(storeRes.data);
        setFollowers(storeRes.data.followers_count || 0);
        setIsFollowing(Boolean(storeRes.data.is_following));

        const productsRes = await axios.get(
          `http://localhost:8000/api/products/?seller=${id}&ordering=-created_at`
        );
        setProducts(
          Array.isArray(productsRes.data)
            ? productsRes.data
            : productsRes.data?.results || []
        );

        const voucherRes = await axios.get(
          `http://localhost:8000/api/promotions/vouchers/public/${id}/`
        );
        const publicVouchers = voucherRes.data || [];
        const now = new Date();
        const valid = (v) =>
          (!v.start_at || new Date(v.start_at) <= now) &&
          (!v.end_at || new Date(v.end_at) >= now);
        setVouchers(publicVouchers.filter(valid));
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cửa hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [id, token]);

  const handleCopyVoucher = (v) => {
    navigator.clipboard.writeText(v.code);
    message.success(`Đã sao chép voucher ${v.code}`);
  };

  const handleUseVoucher = (v) => {
    localStorage.setItem(
      "selectedVoucher",
      JSON.stringify({ code: v.code, sellerId: id, savedAt: Date.now() })
    );
    message.success(`Voucher ${v.code} đã được chọn, áp dụng khi thanh toán`);
  };

  const handleFollow = async () => {
    if (!token) {
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (!isFollowing) {
        await axios.post(
          `http://localhost:8000/api/sellers/${id}/follow/`,
          {},
          { headers }
        );
        setFollowers((f) => f + 1);
      } else {
        await axios.delete(`http://localhost:8000/api/sellers/${id}/follow/`, {
          headers,
        });
        setFollowers((f) => Math.max(0, f - 1));
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi cập nhật trạng thái theo dõi");
    }
  };

  const handleOpenChat = () => {
    try {
      localStorage.setItem("chat:lastSellerId", String(id));
      if (store?.store_name)
        localStorage.setItem("chat:lastSellerName", store.store_name);
      if (store?.image)
        localStorage.setItem("chat:lastSellerImage", store.image);
      window.dispatchEvent(
        new CustomEvent("chat:open", { detail: { sellerId: id } })
      );
    } catch (e) {}
  };

  const ratingStats = useMemo(() => {
    if (!products || products.length === 0) return { avg: 0, total: 0 };
    let totalReviews = 0;
    let weightedSum = 0;
    for (const p of products) {
      const r = Number(p.rating || 0);
      const c = Number(p.review_count || 0);
      totalReviews += c;
      weightedSum += r * c;
    }
    if (totalReviews === 0) {
      const simpleAvg =
        products.reduce((s, p) => s + Number(p.rating || 0), 0) /
        products.length;
      return { avg: Number.isFinite(simpleAvg) ? simpleAvg : 0, total: 0 };
    }
    return { avg: weightedSum / totalReviews, total: totalReviews };
  }, [products]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (!store) {
    return <p className="text-center my-5">❌ Không tìm thấy cửa hàng.</p>;
  }

  const followingCount = Number(store.following_count || 0);

  return (
    <Container className="my-4">
      <StoreHeader
        store={store}
        isFollowing={isFollowing}
        followers={followers}
        followingCount={followingCount}
        ratingStats={ratingStats}
        onFollow={handleFollow}
        onOpenChat={handleOpenChat}
      />

      <VoucherSection vouchers={vouchers} onUseVoucher={handleUseVoucher} />

      <ProductSearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <Row>
        <ProductGrid products={paginatedProducts} />
      </Row>

      {/* Phân trang Ant Design */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            current={currentPage}
            total={filteredProducts.length}
            pageSize={PRODUCTS_PER_PAGE}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false} // không cho đổi số item/trang
            hideOnSinglePage
          />
        </div>
      )}
    </Container>
  );
};

export default StoreDetail;
