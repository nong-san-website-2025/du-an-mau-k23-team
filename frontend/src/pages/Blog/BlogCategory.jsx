import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

export default function BlogCategory() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/blog/category/${slug}/`);
        setPosts(res.data);
        if (res.data.length > 0) {
          setCategoryName(res.data[0].category.name);
        } else {
          setCategoryName(slug);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategoryPosts();
  }, [slug]);

  return (
    <div>
      <h1>Bài viết trong danh mục: {categoryName}</h1>
      {posts.length === 0 ? (
        <p>Chưa có bài viết nào trong danh mục này.</p>
      ) : (
        posts.map(post => (
          <h2 key={post.id}>
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h2>
        ))
      )}
      <Link to="/blog">← Quay lại trang blog</Link>
    </div>
  );
}