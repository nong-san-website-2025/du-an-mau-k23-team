import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import { message, Pagination } from "antd";

// Import các component con với đường dẫn ĐÚNG
import StoreHeader from "../components/StoreDetail/StoreHeder";
import VoucherSection from "../components/StoreDetail/VoucherSection";
import ProductSearchBar from "../components/StoreDetail/ProductSearchBar";
import ProductGrid from "../components/StoreDetail/ProductGrid";

// Import các hàm API cần thiết với đường dẫn ĐÚNG
import {
  getPublicVouchersForSeller,
  getMyVouchers,
  claimVoucher,
} from "../../admin/services/promotionServices";

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // === CÁC STATE CŨ CỦA BẠN (GIỮ NGUYÊN) ===
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 18;

  // === STATE MỚI ĐƯỢC THÊM VÀO ĐỂ XỬ LÝ VOUCHER ===
  const [myVoucherCodes, setMyVoucherCodes] = useState(new Set());
  const [isClaiming, setIsClaiming] = useState(null); // Dùng để hiển thị loading trên nút "Lưu"

  // === LOGIC CŨ CỦA BẠN (GIỮ NGUYÊN) ===
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

  const token = localStorage.getItem("token");

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // === USEEFFECT ĐƯỢC NÂNG CẤP ĐỂ LẤY THÊM VOUCHER CỦA USER ===
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        // Tải đồng thời tất cả dữ liệu để tăng tốc độ
        const [storeRes, productsRes, publicVouchersRes, myVouchersRes] =
          await Promise.all([
            axios.get(`http://localhost:8000/api/sellers/${id}/`, {
              headers: authHeader,
            }),
            axios.get(
              `http://localhost:8000/api/products/?seller=${id}&ordering=-created_at`
            ),
            getPublicVouchersForSeller(id),
            token ? getMyVouchers() : Promise.resolve(null), // Chỉ gọi API này khi đã đăng nhập
          ]);

        // Xử lý dữ liệu store và product (code cũ của bạn)
        setStore(storeRes.data);
        setFollowers(storeRes.data.followers_count || 0);
        setIsFollowing(Boolean(storeRes.data.is_following));
        setProducts(
          Array.isArray(productsRes.data)
            ? productsRes.data
            : productsRes.data?.results || []
        );

        // Xử lý dữ liệu voucher (code cũ của bạn)
        const publicVouchers = publicVouchersRes || [];
        const now = new Date();
        const valid = (v) =>
          (!v.start_at || new Date(v.start_at) <= now) &&
          (!v.end_at || new Date(v.end_at) >= now);
        setVouchers(publicVouchers.filter(valid));

        // PHẦN MỚI: Xử lý voucher đã lưu của user
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
  }, [id, token]);

  // === CÁC HÀM CŨ CỦA BẠN (GIỮ NGUYÊN) ===
  const handleCopyVoucher = (v) => {
    /* ... giữ nguyên code của bạn ... */
  };
  const handleUseVoucher = (v) => {
    localStorage.setItem(
      "selectedVoucher",
      JSON.stringify({ code: v.code, sellerId: id, savedAt: Date.now() })
    );
    message.success(`Voucher ${v.code} đã được chọn, áp dụng khi thanh toán`);
  };
  const handleFollow = async () => {
    /* ... giữ nguyên code của bạn ... */
  };
  const handleOpenChat = () => {
    if (!store?.id) return;

    // Gửi sự kiện để GlobalChat lắng nghe và mở khung chat
    const event = new CustomEvent("chat:open", {
      detail: {
        sellerId: store.id,
        sellerName: store.store_name,
        sellerImage: store.image,
      },
    });
    window.dispatchEvent(event);
  };

  const ratingStats = useMemo(() => {
    /* ... giữ nguyên code của bạn ... */
  }, [products]);

  // === HÀM MỚI ĐƯỢC THÊM VÀO ĐỂ XỬ LÝ LƯU VOUCHER ===
  const handleClaimVoucher = async (voucherCode) => {
    if (!token) {
      message.warning("Vui lòng đăng nhập để lưu voucher!");
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }
    setIsClaiming(voucherCode); // Bắt đầu loading cho nút này
    try {
      await claimVoucher(voucherCode);
      message.success(`Đã lưu voucher ${voucherCode}!`);
      // Cập nhật state để nút chuyển thành "Đã lưu" ngay
      setMyVoucherCodes((prevCodes) => new Set(prevCodes).add(voucherCode));
    } catch (error) {
      message.error(error.response?.data?.error || "Lưu voucher thất bại!");
    } finally {
      setIsClaiming(null); // Dừng loading
    }
  };

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
        handleOpenChat={handleOpenChat} // ✅ Đổi đúng tên prop
      />

      {/* TRUYỀN CÁC PROPS MỚI XUỐNG CHO VOUCHERSECTION */}
      <VoucherSection
        vouchers={vouchers}
        onUseVoucher={handleUseVoucher}
        myVoucherCodes={myVoucherCodes}
        onClaimVoucher={handleClaimVoucher}
        isClaiming={isClaiming}
      />

      <ProductSearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <Row>
        <ProductGrid products={paginatedProducts} />
      </Row>

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
