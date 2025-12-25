import React, { useState, useEffect, useMemo } from "react";
import { Button, Image, Space } from "antd";
import {
  HeartFilled,
  HeartOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import NoImage from "../../../components/shared/NoImage";

// --- HÀM HELPER XỬ LÝ URL ---
const getImageUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  // Nếu là link tuyệt đối (http, data base64, blob) thì giữ nguyên
  if (/^(http|data:image|blob:)/.test(url)) return url;

  // Xử lý link tương đối
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const BASE_URL = API_URL.replace(/\/api\/?$/, ""); // Bỏ đuôi /api
  
  // Đảm bảo đường dẫn bắt đầu bằng /
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${BASE_URL}${path}`;
};

const ProductImage = ({ product, isFavorite, onToggleFavorite }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  
  // State cho Preview Modal
  const [previewVisible, setPreviewVisible] = useState(false);

  const THUMBNAIL_SIZE = 80;
  const MAX_VISIBLE_THUMBNAILS = 4;

  // 1. TẠO DANH SÁCH ẢNH (Dùng useMemo để tối ưu)
  const images = useMemo(() => {
    const list = [];
    if (!product) return list;

    // Thêm ảnh đại diện
    if (product.image) {
      list.push({ url: getImageUrl(product.image), id: "main" });
    }

    // Thêm ảnh gallery
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        const url = getImageUrl(img.image);
        // Tránh trùng lặp với ảnh đại diện
        if (url && url !== list[0]?.url) {
          list.push({ url: url, id: img.id || `sub-${Math.random()}` });
        }
      });
    }
    return list;
  }, [product]);

  const totalImages = images.length;
  const currentImage = images[selectedIndex]?.url;

  // 2. RESET KHI SẢN PHẨM THAY ĐỔI
  useEffect(() => {
    setSelectedIndex(0);
    setThumbnailStart(0);
  }, [product?.id]);

  // 3. LOGIC ĐIỀU HƯỚNG
  const updateThumbnailPosition = (newIndex) => {
    // Tự động cuộn thumbnail nếu index vượt quá vùng hiển thị
    if (newIndex < thumbnailStart) {
      setThumbnailStart(newIndex);
    } else if (newIndex >= thumbnailStart + MAX_VISIBLE_THUMBNAILS) {
      setThumbnailStart(newIndex - MAX_VISIBLE_THUMBNAILS + 1);
    }
  };

  const handlePrevImage = (e) => {
    e?.stopPropagation(); // Ngăn sự kiện click lan ra (để không mở preview)
    const newIndex = selectedIndex === 0 ? totalImages - 1 : selectedIndex - 1;
    setSelectedIndex(newIndex);
    updateThumbnailPosition(newIndex);
  };

  const handleNextImage = (e) => {
    e?.stopPropagation();
    const newIndex = selectedIndex === totalImages - 1 ? 0 : selectedIndex + 1;
    setSelectedIndex(newIndex);
    updateThumbnailPosition(newIndex);
  };

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
    updateThumbnailPosition(index);
  };

  const handleThumbnailNav = (direction) => {
    if (direction === "prev") {
      setThumbnailStart((prev) => Math.max(0, prev - 1));
    } else {
      setThumbnailStart((prev) => Math.min(totalImages - MAX_VISIBLE_THUMBNAILS, prev + 1));
    }
  };

  // Lấy danh sách thumbnail đang hiển thị
  const visibleThumbnails = images.slice(
    thumbnailStart,
    thumbnailStart + MAX_VISIBLE_THUMBNAILS
  );

  if (totalImages === 0) {
    return (
      <div className="responsive-product-image-container" style={{ position: "relative" }}>
        <div style={{ background: "#fafafa", borderRadius: 10, overflow: "hidden" }}>
           <NoImage className="responsive-product-image" text="Không có hình ảnh" />
        </div>
        {/* Vẫn hiện nút tim kể cả khi không có ảnh */}
        <Button
          type="text" shape="circle" size="large"
          icon={isFavorite ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined />}
          onClick={onToggleFavorite}
          style={{ position: "absolute", top: 15, right: 15, background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        />
      </div>
    );
  }

  return (
    <div className="responsive-product-image-container">
      {/* --- KHUNG ẢNH CHÍNH --- */}
      <div
        className="responsive-product-image"
        style={{
          position: "relative",
          margin: "0 auto",
          background: "#fafafa",
          borderRadius: 10,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #f0f0f0"
        }}
      >
        <img
          src={currentImage}
          alt={product?.name}
          onClick={() => setPreviewVisible(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            cursor: "zoom-in",
            transition: "transform 0.3s ease"
          }}
        />

        {/* Nút điều hướng Trái/Phải trên ảnh chính */}
        {totalImages > 1 && (
          <>
            <Button
              type="text" shape="circle" icon={<LeftOutlined />}
              onClick={handlePrevImage}
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.8)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 10
              }}
            />
            <Button
              type="text" shape="circle" icon={<RightOutlined />}
              onClick={handleNextImage}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.8)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 10
              }}
            />
            {/* Chỉ số ảnh (Badge) */}
            <div style={{
              position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 12px",
              borderRadius: 12, fontSize: 12, fontWeight: 500, pointerEvents: "none"
            }}>
              {selectedIndex + 1} / {totalImages}
            </div>
          </>
        )}

        {/* Nút Yêu thích */}
        <Button
          type="text" shape="circle" size="large"
          icon={isFavorite ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined />}
          onClick={onToggleFavorite}
          style={{
            position: "absolute", top: 15, right: 15, zIndex: 10,
            background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        />
      </div>

      {/* --- THUMBNAIL SLIDER --- */}
      {totalImages > 1 && (
        <div style={{ marginTop: 12, position: "relative", padding: "0 24px" }}>
          {/* Nút Prev Thumbnail */}
          {thumbnailStart > 0 && (
            <Button
              type="text" shape="circle" size="small" icon={<LeftOutlined />}
              onClick={() => handleThumbnailNav("prev")}
              style={{ position: "absolute", left: -5, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}
            />
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(visibleThumbnails.length, MAX_VISIBLE_THUMBNAILS)}, 1fr)`,
            gap: 8, // Khoảng cách giữa các thumbnail
          }}>
            {visibleThumbnails.map((img, idx) => {
              const actualIndex = thumbnailStart + idx;
              const isSelected = actualIndex === selectedIndex;
              return (
                <div
                  key={img.id}
                  onMouseEnter={() => handleThumbnailClick(actualIndex)}
                  onClick={() => handleThumbnailClick(actualIndex)}
                  style={{
                    width: "100%", // Responsive theo grid
                    aspectRatio: "1/1",
                    cursor: "pointer",
                    border: isSelected ? "2px solid #1890ff" : "1px solid #e8e8e8",
                    borderRadius: 8,
                    overflow: "hidden",
                    opacity: isSelected ? 1 : 0.6,
                    transition: "all 0.2s",
                  }}
                >
                  <img
                    src={img.url}
                    alt="thumbnail"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              );
            })}
          </div>

          {/* Nút Next Thumbnail */}
          {thumbnailStart + MAX_VISIBLE_THUMBNAILS < totalImages && (
            <Button
              type="text" shape="circle" size="small" icon={<RightOutlined />}
              onClick={() => handleThumbnailNav("next")}
              style={{ position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}
            />
          )}
        </div>
      )}

      {/* --- ẨN IMAGE GROUP ĐỂ DÙNG TÍNH NĂNG PREVIEW CỦA ANTD --- */}
      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          preview={{
            visible: previewVisible,
            onVisibleChange: (vis) => setPreviewVisible(vis),
            current: selectedIndex, // Mở đúng ảnh đang chọn
            onChange: (current) => {
                setSelectedIndex(current);
                updateThumbnailPosition(current);
            }
          }}
        >
          {images.map((img) => (
            <Image key={img.id} src={img.url} />
          ))}
        </Image.PreviewGroup>
      </div>
    </div>
  );
};

export default ProductImage;