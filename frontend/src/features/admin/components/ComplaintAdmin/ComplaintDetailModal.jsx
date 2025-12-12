import React, { useEffect } from "react";
import { Modal, Descriptions, Image, Typography, Empty } from "antd";

const { Text } = Typography;

const ComplaintDetailModal = ({ visible, complaint, onClose }) => {
  useEffect(() => {
    if (visible && complaint) {
      console.log("Dữ liệu khiếu nại chi tiết:", complaint);
    }
  }, [visible, complaint]);

  if (!complaint) return null;

  // =============================
  // Lấy tên NGƯỜI DÙNG
  // =============================
  const getUserName = (data) => {
    if (!data) return "Không xác định";

    if (data.complainant_name) return data.complainant_name;
    if (data.user_name) return data.user_name;
    if (data.username) return data.username;
    if (data.full_name) return data.full_name;

    if (data.user?.name) return data.user.name;
    if (data.user?.full_name) return data.user.full_name;

    if (data.email) return data.email;
    if (data.user?.email) return data.user.email;

    return "Không xác định";
  };

  // =============================
  // Lấy tên NGƯỜI BÁN
  // =============================
  const getSellerName = (data) => {
    if (!data) return "Không xác định";

    // Case backend trả kiểu seller_name: "Shop ABC"
    if (data.seller_name) return data.seller_name;

    // Case backend trả object seller: { name, full_name, username }
    if (data.seller?.name) return data.seller.name;
    if (data.seller?.full_name) return data.seller.full_name;
    if (data.seller?.username) return data.seller.username;
    if (data.seller?.email) return data.seller.email;

    return "Không xác định";
  };

  // =============================
  // MEDIA: Tách hình & video
  // =============================
  const mediaList = Array.isArray(complaint.media_urls) ? complaint.media_urls : [];
  const images = mediaList.filter((u) => !u.match(/\.(mp4|webm|ogg)$/i));
  const videos = mediaList.filter((u) => u.match(/\.(mp4|webm|ogg)$/i));

  return (
    <Modal
      open={visible}
      title="Chi tiết khiếu nại"
      onCancel={onClose}
      footer={null}
      width={700}
      centered
    >
      <Descriptions
        bordered
        column={1}
        styles={{ label: { width: 150, fontWeight: "bold" } }}
      >
        <Descriptions.Item label="Người dùng">
          <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
            {getUserName(complaint)}
          </Text>
        </Descriptions.Item>

        

        <Descriptions.Item label="Sản phẩm">
          {complaint.product_name}
        </Descriptions.Item>

        <Descriptions.Item label="Đơn giá">
          {Number(complaint.unit_price ?? complaint.product_price ?? 0).toLocaleString("vi-VN")} đ
        </Descriptions.Item>

        <Descriptions.Item label="Số lượng">
          {complaint.quantity ?? 1}
        </Descriptions.Item>

        <Descriptions.Item label="Lý do báo cáo">
          <Text type="danger">{complaint.reason}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Ngày tạo">
          {complaint.created_at
            ? new Date(complaint.created_at).toLocaleString("vi-VN")
            : ""}
        </Descriptions.Item>
      </Descriptions>

      {/* MEDIA */}
      <div style={{ marginTop: 20 }}>
        <Text strong style={{ display: "block", marginBottom: 10 }}>
          Hình ảnh & Video bằng chứng:
        </Text>

        {mediaList.length > 0 ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* ẢNH */}
            <Image.PreviewGroup>
              {images.map((url, idx) => (
                <Image
                  key={idx}
                  width={100}
                  height={100}
                  src={url}
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #eee",
                  }}
                />
              ))}
            </Image.PreviewGroup>

            {/* VIDEO */}
            {videos.map((url, idx) => (
              <video
                key={idx}
                src={url}
                controls
                style={{
                  width: 180,
                  height: 100,
                  borderRadius: 8,
                  backgroundColor: "#000",
                  objectFit: "contain",
                }}
              />
            ))}
          </div>
        ) : (
          <Empty
            description="Không có hình ảnh/video đính kèm"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </Modal>
  );
};

export default ComplaintDetailModal;
