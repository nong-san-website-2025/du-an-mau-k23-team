import React, { useState } from "react";
import { Modal, Button, Typography, Rate, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

const RatingModal = ({
  open,
  onCancel,
  product,
  ratingValue,
  setRatingValue,
  comment,
  setComment,
  images,     // State danh sách ảnh (fileList) từ component cha
  setImages,  // Hàm set state ảnh từ component cha
  onSubmit,
  loading,
  isMobile,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Xử lý xem trước ảnh (Preview)
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  // Xử lý khi có thay đổi file (thêm/xóa)
  const handleChange = ({ fileList: newFileList }) => setImages(newFileList);

  // Nút upload hiển thị khi chưa đạt giới hạn số ảnh
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Thêm ảnh</div>
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel} size="large">Hủy</Button>,
          <Button key="submit" type="primary" onClick={onSubmit} loading={loading} size="large">Gửi đánh giá</Button>,
        ]}
        centered
        width={isMobile ? "90%" : 600}
        title={product ? `Đánh giá: ${product.product_name}` : "Đánh giá sản phẩm"} // Hiển thị tên SP trên title modal luôn cho gọn
      >
        {product && (
          <div style={{ padding: "10px 0" }}>
            
            {/* 1. Đánh giá sao */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                Chất lượng sản phẩm <Text type="danger">*</Text>
              </Text>
              <Rate value={ratingValue} onChange={setRatingValue} style={{ fontSize: 32, color: "#fadb14" }} />
              <div style={{ marginTop: 8, minHeight: 22 }}>
                {ratingValue === 5 && <Text type="success" strong>Tuyệt vời</Text>}
                {ratingValue === 4 && <Text type="success" strong>Hài lòng</Text>}
                {ratingValue === 3 && <Text type="warning" strong>Bình thường</Text>}
                {ratingValue === 2 && <Text type="danger" strong>Không hài lòng</Text>}
                {ratingValue === 1 && <Text type="danger" strong>Tệ</Text>}
              </div>
            </div>

            {/* 2. Upload hình ảnh */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
                Hình ảnh thực tế (Tối đa 5 ảnh)
              </Text>
              <Upload
                listType="picture-card"
                fileList={images}
                onPreview={handlePreview}
                onChange={handleChange}
                beforeUpload={() => false} // Quan trọng: Ngăn auto upload
                maxCount={5}
                accept="image/*"
              >
                {images?.length >= 5 ? null : uploadButton}
              </Upload>
            </div>

            {/* 3. Nhập bình luận */}
            <div style={{ marginBottom: 10 }}>
              <Text strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>Nhận xét (không bắt buộc)</Text>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Hãy chia sẻ nhận xét về sản phẩm này nhé..."
                style={{ 
                  width: "100%", 
                  padding: 12, 
                  borderRadius: 8, 
                  border: "1px solid #d9d9d9", 
                  background: "#fff",
                  resize: "vertical",
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xem trước ảnh phóng to (Preview Modal) */}
      <Modal 
        open={previewOpen} 
        title={previewTitle} 
        footer={null} 
        onCancel={() => setPreviewOpen(false)}
        centered
      >
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default RatingModal;