import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import { message, Pagination } from "antd";
import { useCart } from "../../cart/services/CartContext";

// Import các component con
import StoreHeader from "../components/StoreDetail/StoreHeder";
import VoucherSection from "../components/StoreDetail/VoucherSection";
import ProductSearchBar from "../components/StoreDetail/ProductSearchBar";
import ProductGrid from "../components/StoreDetail/ProductGrid";

// Import các hàm API
import {
  getPublicVouchersForSeller,
  getMyVouchers,
  claimVoucher,
} from "../../admin/services/promotionServices";

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // === STATE ===
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 18;

  // State xử lý voucher
  const [myVoucherCodes, setMyVoucherCodes] = useState(new Set());
  const [isClaiming, setIsClaiming] = useState(null);

  // Lấy API URL từ biến môi trường
  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

  // === ADD TO CART ===
  const handleAddToCart = async (e, product) => {
    e?.stopPropagation();
    try {
      await addToCart(
        product.id,
        1,
        {
          id: product.id,
          name: product.name,
          price: product.discounted_price ?? product.price,
          // Xử lý ảnh để đảm bảo đường dẫn đúng
          image: product.image?.startsWith("http")
            ? product.image
            : product.image
            ? `${API_URL.replace("/api", "")}${product.image}`
            : "",
        },
        () => {},
        () => {}
      );
    } catch (err) {
      console.error("Thêm vào giỏ thất bại:", err);
    }
  };

  // === FILTER & PAGINATION ===
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

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // === FETCH DATA ===
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        // Gọi song song các API để tối ưu tốc độ
        const [storeRes, productsRes, publicVouchersRes, myVouchersRes] =
          await Promise.all([
            // SỬ DỤNG ENV Ở ĐÂY
            axios.get(`${API_URL}/sellers/${id}/`, {
              headers: authHeader,
            }),
            axios.get(
              `${API_URL}/products/?seller=${id}&ordering=-created_at`
            ),
            getPublicVouchersForSeller(id),
            token ? getMyVouchers() : Promise.resolve(null),
          ]);

        // 1. Dữ liệu cửa hàng
        setStore(storeRes.data);
        setFollowers(storeRes.data.followers_count || 0);
        setIsFollowing(Boolean(storeRes.data.is_following));

        // 2. Dữ liệu sản phẩm
        setProducts(
          Array.isArray(productsRes.data)
            ? productsRes.data
            : productsRes.data?.results || []
        );

        // 3. Dữ liệu voucher công khai (Lọc những cái còn hạn)
        const publicVouchers = publicVouchersRes || [];
        const now = new Date();
        const validVouchers = publicVouchers.filter((v) => {
          const startDate = v.start_at ? new Date(v.start_at) : null;
          const endDate = v.end_at ? new Date(v.end_at) : null;
          return (!startDate || startDate <= now) && (!endDate || endDate >= now);
        });
        setVouchers(validVouchers);

        // 4. Dữ liệu voucher cá nhân (để biết user đã lưu mã nào rồi)
        if (myVouchersRes) {
          const claimedCodes = new Set(
            myVouchersRes.map((uv) => uv.voucher.code)
          );
          setMyVoucherCodes(claimedCodes);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cửa hàng:", error);
        message.error("Không thể tải dữ liệu cửa hàng.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [id, token, API_URL]);

  // === ACTIONS ===

  const handleCopyVoucher = (v) => {
    navigator.clipboard.writeText(v.code);
    message.success("Đã sao chép mã: " + v.code);
  };

  const handleUseVoucher = (v) => {
    // Lưu vào localStorage để dùng ở trang Checkout
    localStorage.setItem(
      "selectedVoucher",
      JSON.stringify({ code: v.code, sellerId: id, savedAt: Date.now() })
    );
    message.success(`Voucher ${v.code} đã được chọn, sẽ áp dụng khi thanh toán`);
  };

  const handleFollow = async () => {
    if (!token) {
      message.warning("Vui lòng đăng nhập để theo dõi cửa hàng!");
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }

    try {
      // SỬ DỤNG ENV Ở ĐÂY
      await axios.post(
        `${API_URL}/sellers/${id}/follow/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newIsFollowing = !isFollowing;
      setIsFollowing(newIsFollowing);

      if (newIsFollowing) {
        setFollowers(followers + 1);
        message.success("Đã theo dõi cửa hàng!");
      } else {
        setFollowers(Math.max(followers - 1, 0));
        message.success("Đã bỏ theo dõi cửa hàng!");
      }
    } catch (error) {
      console.error("Lỗi khi theo dõi cửa hàng:", error);
      message.error("Không thể thao tác. Vui lòng thử lại!");
    }
  };

  const handleOpenChat = () => {
    if (!store?.id) return;
    const event = new CustomEvent("chat:open", {
      detail: {
        sellerId: store.id,
        sellerName: store.store_name,
        sellerImage: store.image,
      },
    });
    window.dispatchEvent(event);
  };

  const handleClaimVoucher = async (voucherCode) => {
    if (!token) {
      message.warning("Vui lòng đăng nhập để lưu voucher!");
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }
    setIsClaiming(voucherCode);
    try {
      await claimVoucher(voucherCode);
      message.success(`Đã lưu voucher ${voucherCode} vào ví!`);
      // Cập nhật UI ngay lập tức
      setMyVoucherCodes((prevCodes) => new Set(prevCodes).add(voucherCode));
    } catch (error) {
      message.error(error.response?.data?.error || "Lưu voucher thất bại!");
    } finally {
      setIsClaiming(null);
    }
  };

  // Tính toán thống kê đánh giá
  const ratingStats = useMemo(() => {
    const stats = { average: 0, count: 0 };
    if (products.length > 0) {
      let totalRating = 0;
      let totalCount = 0;
      products.forEach((p) => {
        if (p.rating && p.review_count) {
          totalRating += parseFloat(p.rating) * p.review_count;
          totalCount += p.review_count;
        }
      });
      if (totalCount > 0) {
        stats.average = (totalRating / totalCount).toFixed(1);
        stats.count = totalCount;
      }
    }
    return stats;
  }, [products]);

  // === RENDER ===
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
      {/* Header cửa hàng */}
      <StoreHeader
        store={store}
        isFollowing={isFollowing}
        followers={followers}
        followingCount={followingCount}
        ratingStats={ratingStats}
        onFollow={handleFollow}
        handleOpenChat={handleOpenChat}
      />


      {/* Thanh tìm kiếm sản phẩm */}
      <ProductSearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Lưới sản phẩm */}
      <Row>
        <ProductGrid
          products={paginatedProducts}
          onAddToCart={handleAddToCart}
        />
      </Row>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination
            current={currentPage}
            total={filteredProducts.length}
            pageSize={PRODUCTS_PER_PAGE}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            hideOnSinglePage
          />
        </div>
      )}
    </Container>
  );
};

export default StoreDetail;