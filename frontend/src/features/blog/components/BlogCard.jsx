import React from "react";

export default function BlogCard({ post }) {
  return (
    <div className="blog-card bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      
      {/* Image */}
      {post.image ? (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-25 object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-48 w-full bg-gray-100 flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 line-clamp-2">
          {post.title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{post.category_name}</p>
        <p className="text-gray-600 mt-2 text-sm line-clamp-3 flex-1">
          {post.content}
        </p>

        <a
          href={`/blog/${post.slug}`}
          className="mt-4 text-blue-600 font-medium hover:underline self-start"
        >
          Xem chi tiết →
        </a>
      </div>
    </div>
  );
}
