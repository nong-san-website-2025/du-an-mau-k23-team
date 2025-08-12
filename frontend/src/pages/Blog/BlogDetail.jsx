import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/blog/posts/${slug}/`);
        setPost(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPost();
  }, [slug]);

  if (!post) return <p>Đang tải bài viết...</p>;

  return (
    <div>
      <h1
        style={{
          textAlign: 'center',
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontWeight: 700,
          fontSize: 32,
          margin: '0 0 18px 0',
          color: '#111',
          letterSpacing: 0.5,
        }}
      >
        {post.title}
      </h1>
      <p style={{
        color: '#666',
        marginBottom: 18,
        fontSize: 15,
        paddingLeft: 36,
        paddingRight: 36,
        boxSizing: 'border-box',
      }}>
        Tác giả: {post.author} | Ngày: {new Date(post.created_at).toLocaleDateString()}
      </p>
      {post.image && (
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          margin: '32px 0 24px 0',
        }}>
          <img
            src={post.image}
            alt={post.title}
            style={{
              width: '100%',
              maxWidth: 600,
              height: 340,
              objectFit: 'cover',
              borderRadius: 0,
              boxShadow: '0 4px 24px rgba(25,118,210,0.10)',
              background: '#f2f6fa',
              display: 'block',
            }}
          />
        </div>
      )}
      <p style={{
        color: '#222',
        fontSize: 17,
        lineHeight: 1.7,
        textAlign: 'justify',
        marginBottom: 18,
        width: '100%',
        paddingLeft: 36,
        paddingRight: 36,
        boxSizing: 'border-box',
      }}>
        {post.content}
      </p>
      <p style={{
        color: '#444',
        fontSize: 15,
        marginBottom: 18,
        width: '100%',
        paddingLeft: 36,
        paddingRight: 36,
        boxSizing: 'border-box',
      }}>
        Danh mục: <Link to={`/blog/category/${post.category.slug}`} style={{ color: '#1976d2', textDecoration: 'underline' }}>{post.category.name}</Link>
      </p>
      <div style={{ paddingLeft: 36, paddingRight: 36, boxSizing: 'border-box', width: '100%' }}>
        <Link to="/blog" style={{ color: '#1976d2', fontWeight: 500, textDecoration: 'none', marginTop: 10, display: 'inline-block' }}>← Quay lại trang blog</Link>
      </div>
    </div>
  );
}
