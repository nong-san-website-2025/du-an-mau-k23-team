"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Row,
  Col,
  Button,
  Input,
  Select,
  Empty,
  Spin,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import WishlistItem from "./components/WishlistItem";
import RecommendedSection from "./components/RecommendedSection";
import { productApi } from "../../features/products/services/productApi";

const { Option } = Select;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

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

  const filteredWishlist = () => {
    return wishlist.filter((item) => {
      const matchName = item.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filter.status === "" ||
        (filter.status === "conhang" && item.inStock) ||
        (filter.status === "hethang" && !item.inStock);
      return matchName && matchStatus;
    });
  };

  // 👇 Logic fetch recommendation — giữ nguyên từ code gốc
  useEffect(() => {
    const loadRecommended = async () => {
      try {
        setLoadingRec(true);
        const wishlistArr = Array.isArray(wishlist) ? wishlist : [];
        const wishlistIds = new Set(wishlistArr.map(p => p.id));

        const subNames = Array.from(new Set((wishlistArr || [])
          .map(p => p.subcategory_name || p.subcategory?.name || null)
          .filter(Boolean)));

        try {
          const buildTerms = (raw) => {
            const n = (raw || "").toLowerCase().trim();
            const words = n.split(/\s+/).filter(w => w.length >= 3);
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
            const allProducts = categoriesData.flatMap(c => c.subcategories?.flatMap(s => s.products || []) || []);
            const similar = allProducts
              .filter(p => !wishlistIds.has(p.id))
              .filter(p => subNames.length === 0 || subNames.includes(p.subcategory_name));
            setMoreByUserPage(similar);
            setSuggestLimit(12);
          }
        } catch (e) {
          setMoreByUserPage([]);
          setSuggestLimit(12);
        }

        const requests = subNames.map((sub) =>
          axios.get(`${API_URL.replace(/\/$/, "")}/products/?subcategory=${encodeURIComponent(sub)}&ordering=-created_at`)
        );
        const resps = await Promise.all(requests);
        const dataBySub = {};
        resps.forEach((r, idx) => {
          const sub = subNames[idx];
          let items = (r.data || []);
          items = items.filter(p => !wishlistIds.has(p.id));
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
  const filtered = filteredWishlist();

  return (
    <div style={{ background: "linear-gradient(135deg, #f8fdf8 0%, #e8f5e8 100%)", minHeight: "100vh" }}>
      {/* Filter & Search */}
      <div style={{ background: "rgba(255,255,255,0.95)", padding: "16px 0", borderBottom: "2px solid #52c41a" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Button
                type={filter.status === "" && filter.category === "" ? "primary" : "default"}
                icon={<FilterOutlined />}
                onClick={() => setFilter({ status: "", category: "" })}
              >
                Tất Cả
              </Button>
            </Col>
            <Col>
              <Select
                value={filter.status}
                onChange={(value) => setFilter((f) => ({ ...f, status: value }))}
                placeholder="Trạng thái"
                style={{ width: 160 }}
              >
                <Option value="">Tất cả</Option>
                <Option value="conhang">Còn hàng</Option>
                <Option value="hethang">Hết hàng</Option>
              </Select>
            </Col>
            <Col flex="auto" style={{ textAlign: "right" }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm kiếm nông sản yêu thích..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 320, borderRadius: 20 }}
              />
            </Col>
          </Row>
        </div>
      </div>

      <div style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        {filtered.length === 0 ? (
          <Row justify="center">
            <Col span={12} style={{ textAlign: "center" }}>
              <Empty
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                description={
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <img
                        src="/empty-basket-with-vegetables.jpg"
                        alt="Giỏ trống"
                        style={{ width: 120, opacity: 0.7 }}
                      />
                    </div>
                    <h3>Chưa có nông sản yêu thích</h3>
                    <p>Hãy khám phá và thêm sản phẩm vào danh sách!</p>
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => navigate("/")}
                    >
                      Khám Phá Nông Sản
                    </Button>
                  </div>
                }
              />
            </Col>
          </Row>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {filtered.map((item) => (
                <Col key={item.id} xs={12} sm={12} md={8} lg={6} xl={6}>
                  <WishlistItem item={item} onRemove={handleRemove} />
                </Col>
              ))}
            </Row>

            <div style={{ marginTop: 48 }}>
              <h3 style={{ color: "#52c41a", marginBottom: 16 }}>Sản Phẩm Nông Sản Đề Xuất</h3>
              <p className="text-muted">
                Khám phá những sản phẩm nông sản tươi ngon, chất lượng cao được tuyển chọn đặc biệt.
              </p>
              <RecommendedSection
                recommended={recommended}
                moreByUserPage={moreByUserPage}
                suggestLimit={suggestLimit}
                onShowMore={handleShowMore}
                loading={loadingRec}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;