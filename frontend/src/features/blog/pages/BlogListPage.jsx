// src/pages/BlogListPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card, Typography, Space, Tag, Spin } from "antd";
import {
  CalendarOutlined,
  FolderOpenOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { fetchPosts } from "../api/blogApi";

const { Text, Title } = Typography;
const { Meta } = Card;

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={2} style={{ marginBottom: 4, fontWeight: 600 }}>
            Tin Tức
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

        {/* Grid Cards */}
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
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </Text>
                    </Space>

                    <Space size={4} style={{ marginLeft: "auto" }}>
                      <EyeOutlined style={{ color: "#bfbfbf", fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {post.views?.toLocaleString("vi-VN") || 0}
                      </Text>
                    </Space>
                  </div>

                  {/* Title */}
                  <Title
                    level={3}
                    style={{
                      marginBottom: 12,
                      lineHeight: 1.4,
                      maxWidth: "60ch",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {post.title}
                  </Title>

                  {/* Summary */}
                  <Text
                    style={{ fontSize: 13, color: "#595959", lineHeight: 1.6 }}
                  >
                    {limitChars(post.content, 220) ||
                      "Khám phá thêm về sản phẩm và tin tức nông sản mới nhất."}
                  </Text>

                  {/* Read More */}
                  <div style={{ marginTop: "auto", paddingTop: 12 }}>
                    <Text
                      style={{
                        color: "#52c41a",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                      className="read-more"
                    >
                      Đọc thêm <ArrowRightOutlined style={{ fontSize: 11 }} />
                    </Text>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

    </div>
  );
}
