import React from "react";
import { Link } from "react-router-dom"; // Giả sử bạn dùng react-router-dom
import { ArrowRightOutlined } from "@ant-design/icons"; // Tận dụng icon của Antd cho đồng bộ

export default function BlogCard({ post }) {
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
        
        {/* Category Badge - Nổi bật trên ảnh */}
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

        {/* Date / Meta (Optional - thêm vào cho chuyên nghiệp) */}
        <div className="mt-2 text-xs text-gray-400 font-medium">
           {new Date().toLocaleDateString('vi-VN')} {/* Demo date */}
        </div>

        {/* Description */}
        <p className="text-gray-500 mt-3 text-sm leading-relaxed line-clamp-3 flex-1">
          {post.content}
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