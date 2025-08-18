import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function BlogHome() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/blog/posts/?search=${search}`);
        setPosts(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPosts();
  }, [search]);

  return (
    <div style={{ background: '#bfbfbf', minHeight: '100vh'}}>
      <div  style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 0, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
        <h1 style={{ color: '#222', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>Sàn Tin Nông Sản</h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '12px 20px',
              width: 350,
              border: '1.5px solid #080808ff',
              borderRadius: 24,
              outline: 'none',
              fontSize: 16,
              boxShadow: '0 2px 8px rgba(25,118,210,0.06)',
              transition: 'border 0.2s',
              marginRight: 0
            }}
          />
        </div>

        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Không có bài viết nào.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {posts.map(post => (
              <div
                key={post.id}
                style={{
                  background: '#f9fbfd',
                  borderRadius: 14,
                  boxShadow: '0 2px 12px rgba(25,118,210,0.07)',
                  padding: 24,
                  marginBottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s',
                  border: '1.5px solid #e3eaf5',
                  minHeight: 320,
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(25,118,210,0.13)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(25,118,210,0.07)'}
              >
                {post.image && (
                  <div style={{
                    width: '100%',
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f2f6fa',
                    marginBottom: 18,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(25,118,210,0.08)'
                  }}>
                    <img
                      src={post.image}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        background: '#e9eef3'
                      }}
                    />
                  </div>
                )}
                <h2 style={{ color: '#111', fontWeight: 700, fontSize: 22, marginBottom: 10, marginTop: 0 }}>
                  <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: '#111', fontWeight: 700 }}>{post.title}</Link>
                </h2>
                <p style={{ margin: 0, marginBottom: 8, color: '#222', fontSize: 15 }}>
                  Danh mục: <Link to={`/blog/category/${post.category.slug}`} style={{ color: '#222', textDecoration: 'underline' }}>{post.category.name}</Link>
                </p>
                <p style={{ color: '#222', fontSize: 16, marginBottom: 0 }}>
                  {post.content.substring(0, 120)}{post.content.length > 120 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}