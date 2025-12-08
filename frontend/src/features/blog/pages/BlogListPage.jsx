// src/pages/BlogListPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card, Typography, Space, Tag, Spin, Tabs, Empty } from "antd"; // Đã thêm Tabs, Empty
import {
  CalendarOutlined,
  FolderOpenOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { fetchPosts } from "../api/blogApi";

const { Text, Title } = Typography;

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all"); // State lưu danh mục đang chọn

  /* ---------- helpers ---------- */
  const limitChars = (str = "", max = 220) =>
    str.length > max ? str.slice(0, max) + "…" : str;

  /* ---------- fetch data ---------- */
  useEffect(() => {
    fetchPosts()
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("❌ Lỗi khi load blog:", err))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Logic Lọc Danh Mục (Mới) ---------- */
  
  // 1. Trích xuất danh sách các danh mục duy nhất từ bài viết (hoặc bạn có thể fetch từ API danh mục riêng)
  const uniqueCategories = useMemo(() => {
    const categories = posts
      .map((post) => post.category_name)
      .filter((cat) => cat); // Lọc bỏ null/undefined
    return ["all", ...new Set(categories)]; // Thêm 'all' vào đầu và loại bỏ trùng lặp
  }, [posts]);

  // 2. Tạo danh sách bài viết hiển thị dựa trên bộ lọc
  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return posts;
    return posts.filter((post) => post.category_name === selectedCategory);
  }, [posts, selectedCategory]);

  // 3. Cấu hình items cho Tabs
  const tabItems = uniqueCategories.map((cat) => ({
    key: cat,
    label: cat === "all" ? "Tất cả" : cat,
  }));

  /* ---------- render ---------- */
  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #ffffff, #f6ffed, #ffffff)",
        padding: "24px 0px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <Title level={2} style={{ marginBottom: 4, fontWeight: 600 }}>
            Tin Tức & Sự Kiện
          </Title>
          <div
            style={{
              width: 80,
              height: 4,
              background: "linear-gradient(to right, #52c41a, #389e0d)",
              margin: "0 auto",
              borderRadius: 2,
            }}
          />
        </div>

        {/* Filter Tabs (Mới) */}
        <div style={{ marginBottom: 30 }}>
          <Tabs
            activeKey={selectedCategory}
            onChange={(key) => setSelectedCategory(key)}
            centered
            items={tabItems}
            type="card" // Hoặc bỏ dòng này nếu muốn kiểu gạch chân mặc định
            size="large"
            tabBarStyle={{ marginBottom: 0 }}
          />
        </div>

        {/* Grid Cards */}
        {filteredPosts.length > 0 ? (
          <Row gutter={[24, 24]}>
            {filteredPosts.map((post) => (
              <Col xs={24} sm={12} lg={8} key={post.slug}>
                <Link
                  to={`/blog/${post.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 200,
                          overflow: "hidden",
                          position: "relative",
                          background: "#f0f0f0",
                        }}
                      >
                        {post.image ? (
                          <img
                            alt={post.title}
                            src={post.image}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transition: "transform .5s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.transform = "scale(1.08)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          />
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                              color: "#bfbfbf",
                            }}
                          >
                            Không có ảnh
                          </div>
                        )}

                        {/* Category Tag */}
                        {post.category_name && (
                          <div
                            style={{ position: "absolute", top: 12, left: 12 }}
                          >
                            <Tag
                              color="green"
                              icon={<FolderOpenOutlined />}
                              style={{
                                borderRadius: 20,
                                padding: "4px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                border: "none",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              {post.category_name}
                            </Tag>
                          </div>
                        )}
                      </div>
                    }
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                    bodyStyle={{
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    {/* Date & Views */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Space size={4}>
                        <CalendarOutlined
                          style={{ color: "#bfbfbf", fontSize: 12 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(post.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </Text>
                      </Space>

                      <Space size={4} style={{ marginLeft: "auto" }}>
                        <EyeOutlined
                          style={{ color: "#bfbfbf", fontSize: 12 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {post.views?.toLocaleString("vi-VN") || 0}
                        </Text>
                      </Space>
                    </div>

                    {/* Title */}
                    <Title
                      level={4} // Đổi thành level 4 cho cân đối hơn
                      style={{
                        marginBottom: 12,
                        lineHeight: 1.4,
                        minHeight: 44, // Giữ chiều cao cố định cho tiêu đề 2 dòng
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      title={post.title} // Tooltip khi hover
                    >
                      {post.title}
                    </Title>

                    {/* Summary */}
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#595959",
                        lineHeight: 1.6,
                        flex: 1, // Đẩy nút đọc thêm xuống dưới cùng
                      }}
                    >
                      {limitChars(post.content, 120) ||
                        "Khám phá thêm về sản phẩm và tin tức nông sản mới nhất."}
                    </Text>

                    {/* Read More */}
                    <div style={{ marginTop: 16 }}>
                      <Text
                        style={{
                          color: "#52c41a",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Đọc thêm <ArrowRightOutlined style={{ fontSize: 11 }} />
                      </Text>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        ) : (
          /* Empty State khi không có bài viết nào thuộc danh mục */
          <div style={{ padding: "40px 0" }}>
            <Empty description="Chưa có bài viết nào trong mục này" />
          </div>
        )}
      </div>
    </div>
  );
}