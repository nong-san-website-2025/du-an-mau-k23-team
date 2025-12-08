// src/components/home/FeaturedBlogs.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card, Typography, Space, Tag, Spin, Button } from "antd";
import {
  CalendarOutlined,
  FolderOpenOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { fetchPosts } from "../../features/blog/api/blogApi.js";
import "../../styles/home/FeaturedBlogs.css";

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

export default function FeaturedBlogs() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const limitChars = (str = "", max = 300) =>
    str.length > max ? str.slice(0, max) + "…" : str;

  useEffect(() => {
    fetchPosts()
      .then((res) => setPosts(res.data.slice(0, 3)))
      .catch((err) => console.error("❌ Lỗi khi load blog:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px 0px",
        background: "linear-gradient(to bottom, #ffffff, #f6ffed, #ffffff)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title
            level={3}
            style={{
              fontSize: 24,
              marginBottom: 2,
              fontWeight: 600,
            }}
          >
            BÀI VIẾT NỔI BẬT
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

        {/* Blog Grid */}
        <Row gutter={[24, 24]}>
          {posts.map((post) => (
            <Col xs={24} sm={24} md={8} key={post.slug}>
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
                        background: "linear-gradient(135deg, #f0f0f0, #d9d9d9)",
                        position: "relative",
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
                            transition: "transform 0.5s ease",
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
                            fontSize: 14,
                          }}
                        >
                          Không có ảnh
                        </div>
                      )}

                      {/* Category Badge */}
                      {post.category_name && (
                        <div
                          style={{ position: "absolute", top: 12, left: 12 }}
                        >
                          <Tag
                            color="green"
                            style={{
                              borderRadius: 8,
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
                  {/* Date */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    {/* bên trái: ngày đăng */}
                    <Space size={4}>
                      <CalendarOutlined
                        style={{ color: "#bfbfbf", fontSize: 12 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </Text>
                    </Space>

                    {/* bên phải: view */}
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
                      maxWidth: "60ch", // ≈ 60 ký tự
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block", // bỏ -webkit-box
                    }}
                  >
                    {post.title}
                  </Title>

                  {/* Summary */}
                  <Typography.Text
                    style={{ fontSize: 13, color: "#595959", lineHeight: 1.6 }}
                  >
                    {limitChars(post.content, 225) ||
                      "Khám phá thêm về sản phẩm và tin tức nông sản mới nhất."}
                  </Typography.Text>

                  {/* Read More */}
                  <div style={{ marginTop: "auto" }}>
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

        {/* View All Button */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/blog">
            <Button
              type="primary"
              size="large"
              style={{
                background: "linear-gradient(to right, #52c41a, #389e0d)",
                border: "none",
                borderRadius: 24,
                height: 44,
                padding: "0 32px",
                fontSize: 15,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
              }}
            >
              Xem tất cả bài viết
            </Button>
          </Link>
        </div>
      </div>


    </div>
  );
}
