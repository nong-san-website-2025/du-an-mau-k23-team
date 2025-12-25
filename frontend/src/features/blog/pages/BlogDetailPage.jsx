import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPostDetail,
  toggleLike,
  toggleBookmark,
  increaseView,
  fetchPosts,
} from "../api/blogApi";
import { fetchBestSellers } from "../../products/services/productApi";
import ProductCard from "../../products/components/ProductCard";
import { fetchSidebarBanners } from "../../marketing/api/bannerApi";
import {
  message,
  Button,
  Typography,
  Tooltip,
  Skeleton,
  Avatar,
  Divider,
  Tag,
  Row,
  Col,
  Affix,
} from "antd";
import {
  HeartOutlined,
  HeartFilled,
  BookOutlined,
  BookFilled,
  EyeOutlined,
  ShareAltOutlined,
  HomeOutlined,
  FacebookFilled,
  TwitterOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import CommentSection from "../components/CommentSection";
import Layout from "../../../layout/LayoutDefault";
import "../styles/BlogDetailPage.css";

// --- QUAN TRỌNG: Import CSS của React Quill để hiển thị đúng format ---
import "react-quill/dist/quill.snow.css"; 

const { Title, Text } = Typography;

export default function BlogDetailPage() {
  const [sidebarBanners, setSidebarBanners] = useState([]);
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const token = localStorage.getItem("token");
  
  const [topPosts, setTopPosts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    fetchSidebarBanners()
      .then((data) => setSidebarBanners(Array.isArray(data) ? data : []))
      .catch(() => setSidebarBanners([]));
      
    setLoading(true);
    window.scrollTo(0, 0);
    
    fetchPostDetail(slug)
      .then((res) => {
        setPost(res.data);
        setLiked(res.data.is_liked || false);
        setBookmarked(res.data.is_bookmarked || false);
      })
      .catch((err) => {
        console.error(err);
        message.error("Không thể tải bài viết");
      })
      .finally(() => setLoading(false));

    fetchPosts()
      .then((res) => {
        if (Array.isArray(res.data)) {
          const sorted = [...res.data]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 3);
          setTopPosts(sorted);
        }
      })
      .catch(() => setTopPosts([]));

    fetchBestSellers()
      .then((data) => setBestSellers(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setBestSellers([]));

    const viewedKey = `viewed_${slug}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "true");
      increaseView(slug).catch(() => {});
    }
  }, [slug]);

  const handleLike = async () => {
    if (!token) return message.warning("Vui lòng đăng nhập để tương tác");
    try {
      const res = await toggleLike(slug, token);
      if (res.data.status === "liked") message.success("Đã thích bài viết");
      setLiked(!liked);
      setPost((prev) => ({
        ...prev,
        likes_count: liked ? prev.likes_count - 1 : prev.likes_count + 1,
      }));
    } catch (err) {
      message.error("Lỗi kết nối");
    }
  };

  const handleBookmark = async () => {
    if (!token) return message.warning("Vui lòng đăng nhập để lưu bài viết");
    try {
      const res = await toggleBookmark(slug, token);
      if (res.data.status === "bookmarked") message.success("Đã lưu vào bộ sưu tập");
      setBookmarked(!bookmarked);
    } catch (err) {
      message.error("Lỗi kết nối");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success("Đã sao chép liên kết bài viết!");
  };

  if (loading) {
    return (
      <Layout>
        <div className="blog-container">
          <div className="blog-wrapper">
            <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 20 }} />
            <Skeleton.Image active className="skeleton-image" />
            <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 30 }} />
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="empty-state">
          <img src="/assets/not-found.svg" alt="Not found" style={{ width: 200, marginBottom: 20 }} />
          <Title level={3}>Bài viết không tồn tại</Title>
          <Button type="primary" href="/blog">Quay lại trang Blog</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blog-container">
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={17}>
            <article className="blog-main-content">
              <div className="post-meta-top">
                <Tag color="green" className="category-tag">
                  {post.category_name || "Tin tức"}
                </Tag>
                <Text type="secondary" className="post-date">
                  {new Date(post.created_at).toLocaleDateString("vi-VN", {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </Text>
              </div>

              <Title level={1} className="post-title">
                {post.title}
              </Title>

              <div className="author-card">
                <Avatar size={48} src={post.author_avatar} icon={<HomeOutlined />} />
                <div className="author-info">
                  <Text strong className="author-name">{post.author_name || "Admin"}</Text>
                  <div className="post-stats">
                    <Text type="secondary"><EyeOutlined /> {post.views} lượt xem</Text>
                  </div>
                </div>

                <div className="desktop-actions">
                  <Tooltip title="Lưu bài viết">
                    <Button
                      shape="circle"
                      icon={bookmarked ? <BookFilled /> : <BookOutlined />}
                      onClick={handleBookmark}
                      className={bookmarked ? "action-btn active" : "action-btn"}
                    />
                  </Tooltip>
                  <Tooltip title="Chia sẻ">
                    <Button
                      shape="circle"
                      icon={<ShareAltOutlined />}
                      onClick={handleShare}
                      className="action-btn"
                    />
                  </Tooltip>
                </div>
              </div>

              {post.image && (
                <div className="featured-image-wrapper">
                  <img src={post.image?.startsWith('http') ? post.image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${post.image}`} alt={post.title} className="featured-image" />
                </div>
              )}

              {/* --- PHẦN NỘI DUNG CHÍNH (ĐÃ SỬA) --- */}
              {/* Thêm class 'ql-snow' bọc ngoài và 'ql-editor' bên trong để nhận CSS của Quill */}
              <div className="ql-snow">
                <div
                  className="ql-editor prose-content" 
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  style={{ padding: 0, fontSize: '16px', lineHeight: '1.8' }}
                />
              </div>
              {/* ------------------------------------ */}

              <Divider />
              <div className="interaction-footer">
                <div className="like-section">
                  <Button
                    type={liked ? "primary" : "default"}
                    danger={liked}
                    shape="round"
                    size="large"
                    icon={liked ? <HeartFilled /> : <HeartOutlined />}
                    onClick={handleLike}
                    className="big-like-btn"
                  >
                    ({post.likes_count})
                  </Button>
                </div>
                <div className="share-section">
                  <Text type="secondary" style={{ marginRight: 10 }}>Chia sẻ:</Text>
                  <Button type="text" shape="circle" icon={<FacebookFilled style={{ color: '#1877F2', fontSize: 20 }} />} />
                  <Button type="text" shape="circle" icon={<TwitterOutlined style={{ color: '#1DA1F2', fontSize: 20 }} />} />
                  <Button type="text" shape="circle" icon={<CopyOutlined />} onClick={handleShare} />
                </div>
              </div>

              <div className="comments-wrapper">
                <CommentSection postId={post.id} initialComments={post.comments} />
              </div>
            </article>
          </Col>

          <Col xs={24} lg={7}>
            <Affix offsetTop={100} style={{ width: '100%' }}>
              <aside className="blog-sidebar">
                <div className="sidebar-widget">
                  <Title level={4}>Bài viết nổi bật</Title>
                  <div className="related-list">
                    {topPosts.length === 0 && <Text type="secondary">Không có dữ liệu</Text>}
                    {topPosts.map((item) => (
                      <div key={item.id} className="related-item">
                        <div className="related-thumb">
                          {item.image ? (
                            <img src={item.image} alt={item.title} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                              <EyeOutlined />
                            </div>
                          )}
                        </div>
                        <div className="related-info">
                          <Link to={`/blog/${item.slug}`} className="related-title" title={item.title}>
                            {item.title}
                          </Link>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {new Date(item.created_at).toLocaleDateString("vi-VN")}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              <EyeOutlined style={{ marginRight: 4 }} />
                              {item.views}
                            </Text>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sidebar-widget advertisement">
                  {sidebarBanners.length === 0 && <Text type="secondary">Không có banner quảng cáo</Text>}
                  {sidebarBanners.length > 0 && (
                    <>
                      {sidebarBanners.map((banner) => (
                        <a key={banner.id} href={banner.click_url || "#"} target="_blank" rel="noopener noreferrer">
                          <img
                            src={banner.image}
                            alt={banner.title || "Banner"}
                            style={{ width: "100%", borderRadius: 8, marginBottom: 16, objectFit: "cover", maxHeight: 120 }}
                          />
                        </a>
                      ))}
                    </>
                  )}
                  <div>
                    {bestSellers.length === 0 && <Text type="secondary">Không có sản phẩm bán chạy</Text>}
                    {bestSellers.map((product) => (
                      <div key={product.product_id || product.id} style={{ marginBottom: 12 }}>
                        <ProductCard product={{
                          ...product,
                          id: product.product_id || product.id,
                          name: product.product_name || product.name,
                          main_image: { image: product.thumbnail || product.image },
                          discounted_price: product.discounted_price || product.price,
                          sold: product.quantity_sold || product.sold,
                        }} showAddToCart={false} />
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </Affix>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}