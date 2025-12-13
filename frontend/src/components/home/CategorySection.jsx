import React from "react";
import { Link } from "react-router-dom";
import { Skeleton, Empty, Image } from "antd";
import "../../styles/home/CategorySections.css";

export default function CategorySection({ categories = [], loading = false }) {
  // Đã xóa biến fallbackImage custom

  // Số lượng skeleton hiển thị lúc đang tải
  const skeletonCount = 12;

  // --- LOGIC XỬ LÝ EMPTY STATE ---
  if (!loading && categories.length === 0) {
    return (
      <div className="bg-white py-4 px-3 rounded shadow-sm mb-3">
        <div className="d-flex justify-content-center py-3">
          <Empty
            description={<span className="text-secondary">Chưa có danh mục nào</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-3 px-3 rounded shadow-sm mb-3 category-section-container">

      {/* LIST SECTION (SCROLLABLE) */}
      <div className="category-scroll-wrapper">
        {loading
          ? /* --- TRẠNG THÁI LOADING --- */
          Array.from({ length: skeletonCount }).map((_, idx) => (
            <div key={idx} className="category-item-antd">
              <div className="mb-2 custom-skeleton-image">
                <Skeleton.Image active={true} />
              </div>
              <div style={{ width: "80%" }}>
                <Skeleton.Input active={true} size="small" block />
              </div>
            </div>
          ))
          : /* --- TRẠNG THÁI CÓ DỮ LIỆU --- */
          categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="category-item-antd text-decoration-none"
            >
              <div className="category-image-box">
                <Image
                  src={cat.image} // Chỉ truyền ảnh gốc
                  alt={cat.name}
                  preview={false} // Click vào là chuyển trang, không zoom ảnh
                  className="category-img-cover"
                  // Thêm placeholder=true để hiện khung xám hình núi lúc đang load ảnh
                  placeholder={true}
                />
              </div>
              <span className="category-name" title={cat.name}>
                {cat.name}
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}