import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightOutlined } from "@ant-design/icons";

// Hàm tiện ích: Loại bỏ các thẻ HTML để lấy văn bản thuần
const stripHtml = (html) => {
  if (!html) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
};

export default function BlogCard({ post }) {
  // Lấy nội dung text thuần
  const plainDescription = stripHtml(post.content);

  return (
    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
      
      {/* Image Section */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 bg-gray-50">
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        
        {/* Category Badge */}
        {post.category_name && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {post.category_name}
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h2 className="text-lg font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        {/* Date */}
        <div className="mt-2 text-xs text-gray-400 font-medium">
           {post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
        </div>

        {/* Description: Sử dụng text thuần đã lọc thẻ HTML */}
        <p className="text-gray-500 mt-3 text-sm leading-relaxed line-clamp-3 flex-1">
          {plainDescription}
        </p>

        {/* Footer / CTA */}
        <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group/link"
          >
            Đọc tiếp
            <ArrowRightOutlined className="ml-2 transform transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}