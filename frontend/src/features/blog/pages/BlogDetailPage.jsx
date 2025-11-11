// src/pages/BlogDetailPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  fetchPostDetail,
  toggleLike,
  toggleBookmark,
  increaseView,
} from "../api/blogApi";
import { message, Button, Space, Typography, Tooltip, Spin } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  BookOutlined,
  BookFilled,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
} from "@ant-design/icons";
import CommentSection from "../components/CommentSection";
import Layout from "../../../Layout/LayoutDefault";
import "../styles/BlogDetailPage.css";

const { Title } = Typography;

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const token = localStorage.getItem("token");
  const sent = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetchPostDetail(slug)
      .then((res) => {
        setPost(res.data);
        setLiked(res.data.is_liked || false);
        setBookmarked(res.data.is_bookmarked || false);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // 👇 chỉ tăng view 1 lần mỗi session cho mỗi bài
    const viewedKey = `viewed_${slug}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, 'true');
      increaseView(slug).catch(() => {});
    }
  }, [slug]);

  const handleLike = async () => {
    if (!token) return message.warning("Vui lòng đăng nhập để thích bài viết");
    try {
      const res = await toggleLike(slug, token);
      if (res.data.status === "liked") {
        setLiked(true);
        message.success("Đã thích bài viết ❤️");
      } else {
        setLiked(false);
        message.info("Đã bỏ thích");
      }
      const updated = await fetchPostDetail(slug);
      setPost(updated.data);
    } catch (err) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleBookmark = async () => {
    if (!token) return message.warning("Vui lòng đăng nhập để lưu bài viết");
    try {
      const res = await toggleBookmark(slug, token);
      if (res.data.status === "bookmarked") {
        setBookmarked(true);
        message.success("Đã lưu bài viết 💾");
      } else {
        setBookmarked(false);
        message.info("Đã bỏ lưu");
      }
      const updated = await fetchPostDetail(slug);
      setPost(updated.data);
    } catch (err) {
      message.error("Có lỗi xảy ra");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-state">
          <Spin size="large" />
          <p style={{ marginTop: "1rem" }}>Đang tải bài viết...</p>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="empty-state">
          <p style={{ color: "#ef4444", fontSize: "1.2rem" }}>
            ❌ Bài viết không tồn tại
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blog-detail-container">
        <div className="blog-content-wrapper">
          {/* Ảnh đầu bài */}
          {post.image && (
            <div className="blog-header-image">
              <img src={post.image} alt={post.title} />
            </div>
          )}

          {/* Tiêu đề và metadata */}
          <div className="blog-title-section">
            <Title level={1} className="blog-title">
              {post.title}
            </Title>

            <div className="blog-metadata">
              <div className="metadata-item">
                <UserOutlined />
                <span>{post.author_name || "Ẩn danh"}</span>
              </div>
              <div className="metadata-item">
                <CalendarOutlined />
                <span>
                  {new Date(post.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="metadata-item">
                <EyeOutlined />
                <span>{post.views} lượt xem</span>
              </div>
              {post.category_name && (
                <div className="metadata-item">
                  <TagOutlined />
                  <span>{post.category_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Like & Bookmark */}
          <div className="blog-actions">
            <Tooltip title={liked ? "Bỏ thích" : "Thích bài viết"}>
              <Button
                shape="round"
                className={`like-btn ${liked ? "liked" : ""}`}
                icon={liked ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleLike}
              >
                {post.likes_count}
              </Button>
            </Tooltip>

            <Tooltip title={bookmarked ? "Bỏ lưu" : "Lưu bài viết"}>
              <Button
                shape="round"
                className={`bookmark-btn ${bookmarked ? "bookmarked" : ""}`}
                icon={bookmarked ? <BookFilled /> : <BookOutlined />}
                onClick={handleBookmark}
              >
                {post.bookmarks_count}
              </Button>
            </Tooltip>
          </div>

          {/* Nội dung bài viết */}
          <div className="blog-content-card">
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Bình luận */}
          <CommentSection postId={post.id} initialComments={post.comments} />
        </div>
      </div>
    </Layout>
  );
}
