// src/pages/BlogListPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../admin/services/axiosInstance";
import { Link } from "react-router-dom";
import { Row, Col, Card, Typography, Space, Tag, Spin, Empty } from "antd"; // Removed Tabs
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
  // Removed category tabs; show only admin-managed content
  const [pageHeader, setPageHeader] = useState({ title: "", banner_image: null, content_html: "" });

  /* ---------- helpers ---------- */
  const limitChars = (str = "", max = 220) =>
    str.length > max ? str.slice(0, max) + "…" : str;
  const stripHtml = (html) => {
    if (!html) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  /* ---------- fetch data ---------- */
  useEffect(() => {
    fetchPosts()
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("❌ Lỗi khi load blog:", err))
      .finally(() => setLoading(false));
    // Load CMS header for blog page (no hardcoded fallback)
    axiosInstance
      .get('/pages/blog/')
      .then(res => {
        setPageHeader({
          title: res.data?.title || "",
          banner_image: res.data?.banner_image || null,
          content_html: res.data?.content_html || ""
        });
      })
      .catch(() => {});
  }, []);

  /* ---------- No category tabs: render posts directly ---------- */

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
        padding: 0,
      }}
    >
      {/* HERO from CMS */}
      <div
        style={{
          position: "relative",
          minHeight: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {pageHeader.banner_image && (
          <img
            src={pageHeader.banner_image?.startsWith('http') ? pageHeader.banner_image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${pageHeader.banner_image}`}
            alt={pageHeader.title || "Blog"}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.9)",
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 1, padding: "40px 16px" }}>
          {pageHeader.title && (
            <Title level={2} style={{ marginBottom: 8, fontWeight: 700, color: "#389E0D" }}>
              {pageHeader.title}
            </Title>
          )}
          {pageHeader.content_html && (
            <div
              className="lead"
              style={{ maxWidth: 900, margin: "0 auto", color: "#4a4a4a" }}
              dangerouslySetInnerHTML={{ __html: pageHeader.content_html }}
            />
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>

        {/* Removed hardcoded tabs: show only admin-managed content */}

        {/* Grid Cards */}
        {posts.length > 0 ? (
          <Row gutter={[24, 24]}>
            {posts.map((post) => (
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
                            src={post.image?.startsWith('http') ? post.image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${post.image}`}
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
                      {limitChars(stripHtml(post.content), 120)}
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