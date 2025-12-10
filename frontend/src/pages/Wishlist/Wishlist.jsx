"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Row, Col, Button, Input, Select, Empty, Spin, Skeleton } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import WishlistItem from "./components/WishlistItem";
import RecommendedSection from "./components/RecommendedSection";
import { productApi } from "../../features/products/services/productApi";
import Layout from "../../Layout/LayoutDefault";

const { Option } = Select;
const API_URL = process.env.REACT_APP_API_URL;

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState({ status: "", category: "" });
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

  const handleRemove = (id) => {
    const newList = wishlist.filter((item) => item.id !== id);
    setWishlist(newList);
    localStorage.setItem("wishlist", JSON.stringify(newList));
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

  // 👇 Logic fetch recommendation — giữ nguyên logic, chỉ nâng UX
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

        try {
          const buildTerms = (raw) => {
            const n = (raw || "").toLowerCase().trim();
            const words = n.split(/\s+/).filter((w) => w.length >= 3);
            const uniq = Array.from(new Set(words));
            const terms = [];
            if (n) terms.push(n);
            if (uniq[0]) terms.push(uniq[0]);
            if (uniq[1]) terms.push(uniq[1]);
            return terms.slice(0, 3);
          };

          const searchPromises = wishlistArr.flatMap((it) => {
            const name = it.name?.trim();
            const sub = it.subcategory_name || it.subcategory?.name || "";
            const terms = buildTerms(name);
            if (terms.length === 0) return [Promise.resolve([])];
            return terms.map((t) =>
              productApi
                .searchProducts(t, sub ? { subcategory: sub } : {})
                .then((res) => (Array.isArray(res) ? res : []))
                .catch(() => [])
            );
          });
          const byNameGroups = await Promise.all(searchPromises);
          const merged = [];
          const seen = new Set();
          byNameGroups.flat().forEach((p) => {
            if (!p || wishlistIds.has(p.id) || seen.has(p.id)) return;
            seen.add(p.id);
            merged.push(p);
          });

          if (merged.length > 0) {
            setMoreByUserPage(merged);
            setSuggestLimit(12);
          } else {
            const categoriesData = await productApi.getCategoriesWithProducts();
            const allProducts = categoriesData.flatMap(
              (c) => c.subcategories?.flatMap((s) => s.products || []) || []
            );
            const similar = allProducts
              .filter((p) => !wishlistIds.has(p.id))
              .filter(
                (p) =>
                  subNames.length === 0 || subNames.includes(p.subcategory_name)
              );
            setMoreByUserPage(similar);
            setSuggestLimit(12);
          }
        } catch (e) {
          setMoreByUserPage([]);
          setSuggestLimit(12);
        }

        const requests = subNames.map((sub) =>
          axios.get(
            `${API_URL.replace(/\/$/, "")}/products/?subcategory=${encodeURIComponent(sub)}&ordering=-created_at`
          )
        );
        const resps = await Promise.all(requests);
        const dataBySub = {};
        resps.forEach((r, idx) => {
          const sub = subNames[idx];
          let items = r.data || [];
          items = items.filter((p) => !wishlistIds.has(p.id));
          dataBySub[sub] = items.slice(0, 8);
        });
        setRecommended(dataBySub);
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
      <div
        style={{
          background: "linear-gradient(135deg, #f9fbf9 0%, #f0f9f0 100%)",
          minHeight: "100vh",
          paddingBottom: 64,
        }}
      >
        {/* Header Section */}
        <div
          style={{
            background: "#fff",
            padding: "24px 0",
            borderBottom: "1px solid #e8f5e8",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <Row gutter={[16, 16]} align="middle">
              <Col>
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#2e7d32",
                    margin: 0,
                  }}
                >
                  Danh Sách Yêu Thích
                </h1>
              </Col>
              <Col flex="auto" style={{ textAlign: "right" }}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#888" }} />}
                  placeholder="Tìm kiếm trong danh sách yêu thích..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: 360,
                    borderRadius: 24,
                    border: "1px solid #d0f0d0",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                  }}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col>
                <Button
                  type={filter.status === "" ? "primary" : "default"}
                  onClick={() => setFilter((f) => ({ ...f, status: "" }))}
                  style={{
                    borderRadius: 20,
                    fontWeight: 500,
                  }}
                >
                  Tất Cả
                </Button>
              </Col>
              <Col>
                <Button
                  type={filter.status === "conhang" ? "primary" : "default"}
                  onClick={() => setFilter((f) => ({ ...f, status: "conhang" }))}
                  style={{
                    borderRadius: 20,
                    fontWeight: 500,
                    backgroundColor: filter.status === "conhang" ? "#e8f5e8" : "transparent",
                    borderColor: filter.status === "conhang" ? "#52c41a" : "#d9d9d9",
                    color: filter.status === "conhang" ? "#2e7d32" : "#595959",
                  }}
                >
                  Còn Hàng
                </Button>
              </Col>
              <Col>
                <Button
                  type={filter.status === "hethang" ? "primary" : "default"}
                  onClick={() => setFilter((f) => ({ ...f, status: "hethang" }))}
                  style={{
                    borderRadius: 20,
                    fontWeight: 500,
                    backgroundColor: filter.status === "hethang" ? "#fff0f0" : "transparent",
                    borderColor: filter.status === "hethang" ? "#ff4d4f" : "#d9d9d9",
                    color: filter.status === "hethang" ? "#cf1322" : "#595959",
                  }}
                >
                  Hết Hàng
                </Button>
              </Col>
            </Row>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            maxWidth: 1200,
            margin: "32px auto 0",
            padding: "0 24px",
          }}
        >
          {filtered.length === 0 ? (
            <Row justify="center" style={{ paddingTop: 48 }}>
              <Col xs={24} md={16} lg={12} style={{ textAlign: "center" }}>
                <div
                  style={{
                    background: "#f8fdf8",
                    borderRadius: 20,
                    padding: 40,
                    border: "1px dashed #c8e6c9",
                  }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <img
                      src="/empty-basket-with-vegetables.jpg"
                      alt="Danh sách trống"
                      style={{
                        width: 140,
                        opacity: 0.8,
                        borderRadius: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                  </div>
                  <h2 style={{ color: "#2e7d32", fontWeight: 600, fontSize: 22, marginBottom: 12 }}>
                    Chưa có sản phẩm yêu thích
                  </h2>
                  <p style={{ color: "#666", fontSize: 16, marginBottom: 24 }}>
                    Hãy khám phá các sản phẩm nông sản tươi ngon và thêm vào danh sách yêu thích của bạn!
                  </p>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => navigate("/")}
                    style={{
                      background: "#4CAF50",
                      borderColor: "#4CAF50",
                      borderRadius: 24,
                      fontWeight: 600,
                      padding: "0 32px",
                      height: 48,
                    }}
                  >
                    Khám Phá Nông Sản
                  </Button>
                </div>
              </Col>
            </Row>
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {filtered.map((item) => (
                  <Col key={item.id} xs={12} sm={12} md={8} lg={6}>
                    <WishlistItem item={item} onRemove={handleRemove} />
                  </Col>
                ))}
              </Row>

              <div style={{ marginTop: 64 }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#2e7d32",
                      margin: 0,
                    }}
                  >
                    Gợi Ý Cho Bạn
                  </h2>
                  <div
                    style={{
                      height: 1,
                      flex: 1,
                      background: "linear-gradient(to right, #4CAF50, transparent)",
                      marginLeft: 16,
                      opacity: 0.3,
                    }}
                  />
                </div>
                <p style={{ color: "#666", marginBottom: 32 }}>
                  Những sản phẩm nông sản tươi ngon, chất lượng cao được chọn lọc dựa trên sở thích của bạn.
                </p>

                {loadingRec ? (
                  <Row gutter={[24, 24]}>
                    {[...Array(8)].map((_, i) => (
                      <Col key={i} xs={12} sm={12} md={8} lg={6}>
                        <Skeleton active avatar={{ shape: "square", size: "100%" }} paragraph={{ rows: 2 }} />
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