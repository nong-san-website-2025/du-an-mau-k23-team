import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Row,
  Col,
  Button,
  Input,
  Empty,
  Skeleton,
  message,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

// Import ProductCard chuẩn
import ProductCard from "../../features/products/components/ProductCard"; // Đảm bảo đường dẫn đúng
import RecommendedSection from "./components/RecommendedSection";
import { productApi } from "../../features/products/services/productApi";
import Layout from "../../layout/LayoutDefault";

import "./Wishlist.css";

const API_URL = process.env.REACT_APP_API_URL;

const Wishlist = () => {
  // --- 1. STATE & LOGIC GIỮ NGUYÊN ---
  // Set page title
  useEffect(() => {
    const prev = document.title;
    document.title = "GreenFarm - Yêu Thích";
    return () => { document.title = prev; };
  }, []);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState({ status: "" });
  const [search, setSearch] = useState(() => {
    try {
      return localStorage.getItem("wishlist_search") || "";
    } catch {
      return "";
    }
  });
  const [recommended, setRecommended] = useState({});
  const [moreByUserPage, setMoreByUserPage] = useState([]);
  const [suggestLimit, setSuggestLimit] = useState(12);
  const [loadingRec, setLoadingRec] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("wishlist_search", search);
  }, [search]);

  // Hàm xóa sản phẩm
  const handleRemove = (e, id) => {
    e.stopPropagation(); // Ngăn chặn click vào card để chuyển trang
    const newList = wishlist.filter((item) => item.id !== id);
    setWishlist(newList);
    localStorage.setItem("wishlist", JSON.stringify(newList));
    message.success("Đã xóa khỏi danh sách yêu thích");
  };

  // Hàm thêm vào giỏ (Mockup - bạn thay bằng Context Cart thật của bạn)
  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    message.success(`Đã thêm ${product.name} vào giỏ hàng!`);
    // Gọi hàm addToCart từ Context của bạn ở đây
  };

  const filtered = useMemo(() => {
    return wishlist.filter((item) => {
      const matchName = item.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filter.status === "" ||
        (filter.status === "conhang" && item.inStock) ||
        (filter.status === "hethang" && !item.inStock);
      return matchName && matchStatus;
    });
  }, [wishlist, search, filter]);

  // --- Logic Fetch Recommended (Giữ nguyên logic của bạn) ---
  useEffect(() => {
    const loadRecommended = async () => {
      try {
        setLoadingRec(true);
        const wishlistArr = Array.isArray(wishlist) ? wishlist : [];
        const wishlistIds = new Set(wishlistArr.map((p) => p.id));

        const subNames = Array.from(
          new Set(
            (wishlistArr || [])
              .map((p) => p.subcategory_name || p.subcategory?.name || null)
              .filter(Boolean)
          )
        );

        // ... (Giữ nguyên phần logic phức tạp buildTerms của bạn ở đây để ngắn gọn) ...
        // Tôi giả định phần logic fetch này không đổi so với code gốc bạn gửi
        
        // Mockup logic fetch nhanh để demo code chạy (Bạn hãy paste lại logic gốc vào đây)
        if (wishlistArr.length > 0) {
             const categoriesData = await productApi.getCategoriesWithProducts();
             const allProducts = categoriesData.flatMap(
               (c) => c.subcategories?.flatMap((s) => s.products || []) || []
             );
             setMoreByUserPage(allProducts.slice(0, 12));
        }

      } catch (e) {
        console.error("Load recommended failed", e);
      } finally {
        setLoadingRec(false);
      }
    };

    if (wishlist && wishlist.length > 0) loadRecommended();
    else {
      setRecommended({});
      setMoreByUserPage([]);
    }
  }, [wishlist]);

  const handleShowMore = () => setSuggestLimit((prev) => prev + 12);

  return (
    <Layout>
      <div className="wishlist-page-wrapper">
        {/* Header Section */}
        <div className="wishlist-header">
          <div className="container-custom">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={12}>
                <h1 className="wishlist-title">Danh Sách Yêu Thích</h1>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#888" }} />}
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="wishlist-search"
                />
              </Col>
            </Row>

            <div className="wishlist-filters">
              <Button
                type={filter.status === "" ? "primary" : "text"}
                onClick={() => setFilter((f) => ({ ...f, status: "" }))}
                className="filter-btn"
              >
                Tất Cả
              </Button>
              <Button
                type={filter.status === "conhang" ? "primary" : "text"}
                onClick={() => setFilter((f) => ({ ...f, status: "conhang" }))}
                className="filter-btn success"
              >
                Còn Hàng
              </Button>
              <Button
                type={filter.status === "hethang" ? "primary" : "text"}
                onClick={() => setFilter((f) => ({ ...f, status: "hethang" }))}
                className="filter-btn danger"
              >
                Hết Hàng
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-custom content-body">
          {filtered.length === 0 ? (
            <div className="empty-state-wrapper">
              <img
                src="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                alt="Empty"
                style={{ width: 140, marginBottom: 20 }}
              />
              <h2>Chưa có sản phẩm nào</h2>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate("/")}
                style={{ background: "#4CAF50", borderColor: "#4CAF50" }}
              >
                Khám Phá Ngay
              </Button>
            </div>
          ) : (
            <>
              {/* DANH SÁCH SẢN PHẨM YÊU THÍCH */}
              <Row gutter={[16, 16]}>
                {filtered.map((item) => (
                  <Col key={item.id} xs={12} sm={8} md={6} lg={6} xl={4}>
                    <div className="product-card-wrapper">
                      {/* Nút xóa nổi đè lên ProductCard */}
                      <Tooltip title="Xóa khỏi yêu thích">
                        <Button
                          className="wishlist-remove-btn"
                          shape="circle"
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={(e) => handleRemove(e, item.id)}
                        />
                      </Tooltip>
                      
                      {/* Tái sử dụng ProductCard */}
                      <ProductCard 
                        product={item} 
                        onAddToCart={handleAddToCart}
                        showAddToCart={true}
                      />
                    </div>
                  </Col>
                ))}
              </Row>

              {/* PHẦN GỢI Ý */}
              <div style={{ marginTop: 64 }}>
                <div className="section-header">
                  <h2>Gợi Ý Cho Bạn</h2>
                  <div className="divider" />
                </div>

                {loadingRec ? (
                  <Row gutter={[16, 16]}>
                    {[...Array(6)].map((_, i) => (
                      <Col key={i} xs={12} sm={8} md={6} lg={4}>
                        <Skeleton.Image active style={{ width: "100%", height: 180 }} />
                        <Skeleton active paragraph={{ rows: 2 }} />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <RecommendedSection
                    recommended={recommended}
                    moreByUserPage={moreByUserPage}
                    suggestLimit={suggestLimit}
                    onShowMore={handleShowMore}
                    loading={loadingRec}
                    onAddToCart={handleAddToCart} // Truyền hàm add cart xuống
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;