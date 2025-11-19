import React, { useState } from "react";
import { Button, Image } from "antd";
import { 
  HeartFilled, 
  HeartOutlined, 
  LeftOutlined, 
  RightOutlined 
} from "@ant-design/icons";
import NoImage from "../../../components/shared/NoImage";

const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /^(http|\/|data:image|blob:)/.test(url);
};

const ProductImage = ({ product, isFavorite, onToggleFavorite }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const THUMBNAIL_SIZE = 80; // ✅ Giảm từ 100px xuống 80px
  const MAX_VISIBLE_THUMBNAILS = 4;

  // Tạo danh sách ảnh từ product.images hoặc fallback về ảnh chính
  const images = [];
  
  // Thêm ảnh chính trước
  if (isValidImageUrl(product.image)) {
    const mainImageUrl = product.image.startsWith("/")
      ? `http://localhost:8000${product.image}`
      : product.image;
    images.push({ url: mainImageUrl, id: "main" });
  }

  // Thêm các ảnh phụ từ product.images
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (isValidImageUrl(img.image)) {
        const imgUrl = img.image.startsWith("/")
          ? `http://localhost:8000${img.image}`
          : img.image;
        
        // Không thêm nếu trùng với ảnh chính
        if (imgUrl !== images[0]?.url) {
          images.push({ url: imgUrl, id: img.id });
        }
      }
    });
  }

  const hasValidImage = images.length > 0;
  const currentImage = images[selectedIndex]?.url;
  const totalImages = images.length;

  // Xử lý chuyển ảnh
  const handlePrevImage = () => {
    const newIndex = selectedIndex === 0 ? totalImages - 1 : selectedIndex - 1;
    setSelectedIndex(newIndex);
    
    // Điều chỉnh thumbnail carousel
    if (newIndex < thumbnailStart) {
      setThumbnailStart(Math.max(0, newIndex));
    } else if (newIndex >= thumbnailStart + MAX_VISIBLE_THUMBNAILS) {
      setThumbnailStart(Math.max(0, newIndex - MAX_VISIBLE_THUMBNAILS + 1));
    }
  };

  const handleNextImage = () => {
    const newIndex = selectedIndex === totalImages - 1 ? 0 : selectedIndex + 1;
    setSelectedIndex(newIndex);
    
    // Điều chỉnh thumbnail carousel
    if (newIndex < thumbnailStart) {
      setThumbnailStart(Math.max(0, newIndex));
    } else if (newIndex >= thumbnailStart + MAX_VISIBLE_THUMBNAILS) {
      setThumbnailStart(Math.max(0, newIndex - MAX_VISIBLE_THUMBNAILS + 1));
    }
  };

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
    
    // Tự động điều chỉnh thumbnail carousel để ảnh được chọn luôn hiển thị
    if (index < thumbnailStart) {
      setThumbnailStart(index);
    } else if (index >= thumbnailStart + MAX_VISIBLE_THUMBNAILS) {
      setThumbnailStart(Math.max(0, index - MAX_VISIBLE_THUMBNAILS + 1));
    }
  };

  const handleThumbnailPrev = () => {
    setThumbnailStart(Math.max(0, thumbnailStart - 1));
  };

  const handleThumbnailNext = () => {
    setThumbnailStart(
      Math.min(totalImages - MAX_VISIBLE_THUMBNAILS, thumbnailStart + 1)
    );
  };

  // Xử lý click để preview
  const handleImageClick = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  // Lấy danh sách thumbnails hiển thị
  const visibleThumbnails = images.slice(
    thumbnailStart,
    thumbnailStart + MAX_VISIBLE_THUMBNAILS
  );

  const showThumbnailNav = totalImages > MAX_VISIBLE_THUMBNAILS;

  return (
    <div className="responsive-product-image-container">
      {/* Ảnh chính */}
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
        }}
      >
        {hasValidImage ? (
          <>
            <img
              src={currentImage}
              alt={product.name}
              onClick={() => handleImageClick(currentImage)} // ✅ Click để preview
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                cursor: "pointer", // ✅ Hiển thị con trỏ pointer
              }}
            />

            {/* Nút điều hướng ảnh chính */}
            {totalImages > 1 && (
              <>
                <Button
                  type="text"
                  shape="circle"
                  icon={<LeftOutlined />}
                  onClick={handlePrevImage}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.9)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                />
                <Button
                  type="text"
                  shape="circle"
                  icon={<RightOutlined />}
                  onClick={handleNextImage}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.9)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                />

                {/* Chỉ số ảnh */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {selectedIndex + 1} / {totalImages}
                </div>
              </>
            )}
          </>
        ) : (
          <NoImage className="responsive-product-image" text="Không có hình ảnh" />
        )}

        {/* Nút yêu thích */}
        <Button
          type="text"
          shape="circle"
          size="large"
          icon={
            isFavorite ? (
              <HeartFilled style={{ color: "#ff4d4f" }} />
            ) : (
              <HeartOutlined />
            )
          }
          onClick={onToggleFavorite}
          style={{
            position: "absolute",
            top: 15,
            right: 15,
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          title={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
        />
      </div>

      {/* Thumbnail carousel - chỉ hiển thị khi có nhiều hơn 1 ảnh */}
      {totalImages > 1 && (
        <div
          style={{
            marginTop: 12,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Nút prev thumbnail */}
          {showThumbnailNav && thumbnailStart > 0 && (
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<LeftOutlined />}
              onClick={handleThumbnailPrev}
              style={{
                position: "absolute",
                left: -20,
                zIndex: 2,
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
          )}

          {/* Grid thumbnails */}
          <div
            className="responsive-thumbnail-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(totalImages, MAX_VISIBLE_THUMBNAILS)}, 1fr)`,
              gap: 0, // ✅ Khoảng cách = 0
              width: "100%",
            }}
          >
            {visibleThumbnails.map((img, idx) => {
              const actualIndex = thumbnailStart + idx;
              const isSelected = actualIndex === selectedIndex;
              
              return (
                <div
                  key={img.id}
                  onMouseEnter={() => handleThumbnailClick(actualIndex)} // ✅ Hover để active
                  onClick={() => handleImageClick(img.url)} // ✅ Click để preview
                  style={{
                    width: THUMBNAIL_SIZE,
                    height: THUMBNAIL_SIZE,
                    cursor: "pointer",
                    border: isSelected
                      ? "3px solid #1890ff"
                      : "2px solid #e8e8e8",
                    borderRadius: 8,
                    overflow: "hidden",
                    transition: "all 0.3s",
                    opacity: isSelected ? 1 : 0.6,
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                    boxShadow: isSelected
                      ? "0 4px 12px rgba(24, 144, 255, 0.3)"
                      : "none",
                  }}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${actualIndex + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Nút next thumbnail */}
          {showThumbnailNav && 
           thumbnailStart + MAX_VISIBLE_THUMBNAILS < totalImages && (
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<RightOutlined />}
              onClick={handleThumbnailNext}
              style={{
                position: "absolute",
                right: -20,
                zIndex: 2,
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
          )}
        </div>
      )}

      <Image
        width={0}
        height={0}
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />
    </div>
  );
};

export default ProductImage;