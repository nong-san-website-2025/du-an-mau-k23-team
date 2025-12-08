// src/features/blog/api/blogApi.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "";  // Fallback to empty string for proxy
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Get CSRF token from cookie
function getCsrfToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// 📰 Bài viết (Public) 
export const fetchPosts = () => axios.get(`${API_BASE}/blogs/`);
export const fetchPostDetail = (slug) => axios.get(`${API_BASE}/blogs/${slug}/`);
export const increaseView = (slug) => axios.post(`${API_BASE}/blogs/${slug}/increase-view/`, {}, {
  headers: {
    'X-CSRFToken': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  withCredentials: true  // This is required for cookies/session
});

// 🏷️ Danh mục
export const fetchCategories = () => axios.get(`${API_BASE}/categories/`);

export const createCategory = (data) =>
  axios.post(`${API_BASE}/admin/categories/`, data, { 
    headers: { ...authHeader(), "Content-Type": "application/json" } 
  });

export const updateCategory = (id, data) =>
  axios.patch(`${API_BASE}/admin/categories/${id}/`, data, { 
    headers: authHeader() 
  });

export const deleteCategory = (id) =>
  axios.delete(`${API_BASE}/admin/categories/${id}/`, { headers: authHeader() });

// 💬 Bình luận
export const fetchComments = (postId) => axios.get(`${API_BASE}/comments/?post=${postId}`);
export const addComment = (data) =>
  axios.post(`${API_BASE}/comments/`, data, { headers: authHeader() });

// ❤️ Like / Unlike
export const toggleLike = (slug) =>
  axios.post(`${API_BASE}/blogs/${slug}/like/`, {}, { headers: authHeader() });

// 💾 Bookmark / Unbookmark
export const toggleBookmark = (slug) =>
  axios.post(`${API_BASE}/blogs/${slug}/bookmark/`, {}, { headers: authHeader() });

// 🧭 Admin: CRUD Blog
export const adminFetchBlogs = (page = 1, pageSize = 10) =>
  axios.get(`${API_BASE}/admin/blogs/`, {
    headers: authHeader(),
    params: { page, page_size: pageSize },
  });

export const adminCreateBlog = (formData) =>
  axios.post(`${API_BASE}/admin/blogs/`, formData, {
    headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
  });

export const adminUpdateBlog = (slug, formData) =>
  axios.patch(`${API_BASE}/admin/blogs/${slug}/`, formData, {
    headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
  });

export const adminDeleteBlog = (slug) =>
  axios.delete(`${API_BASE}/admin/blogs/${slug}/`, { headers: authHeader() });

export const adminTogglePublish = (slug, checked) =>
  axios.patch(
    `${API_BASE}/admin/blogs/${slug}/toggle_publish/`,
    { is_published: checked },
    { headers: authHeader() }
  );
