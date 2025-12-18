// components/ComplaintForm.jsx
import React from "react";
import { Typography, Button, Space, Upload, message } from "antd";
import { MessageOutlined, InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import { intcomma } from "./../../../utils/format";

const { Text, Title } = Typography;

const ComplaintForm = ({
  visible,
  orderItemId, // Nhận ID Order Item
  productName,
  productPrice,
  productQuantity,
  text,
  files,
  isLoading,
  isMobile,
  onClose,
  onChangeText,
  onChangeFiles,
  onSubmit,
}) => {
  if (!visible) return null;

  // Xử lý khi bấm nút Gửi
  const handleSubmit = () => {
    if (!text || text.trim().length < 10) {
      message.error("Vui lòng nhập lý do chi tiết (tối thiểu 10 ký tự)");
      return;
    }
    // Gọi hàm submit ở cha, truyền ID item
    onSubmit(orderItemId);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.6)", // Tối hơn xíu cho tập trung
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
          borderRadius: 16,
          padding: isMobile ? 20 : 32,
          maxWidth: 500,
          width: "100%",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            cursor: "pointer",
            fontSize: 20,
            color: "#8c8c8c",
            border: "none",
            background: "transparent",
            width: 32,
            height: 32,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onClick={onClose}
        >
          ✕
        </button>

        <Title level={4} style={{ marginBottom: 16, textAlign: 'center' }}>
          Yêu cầu Hoàn tiền / Trả hàng
        </Title>
        
        {/* Thông tin tóm tắt sản phẩm đang kiện */}
        <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, marginBottom: 20 }}>
            <Text strong>{productName}</Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <Text type="secondary">Số lượng: {productQuantity}</Text>
                <Text type="secondary">Giá mua: {intcomma(productPrice)}đ</Text>
            </div>
            <div style={{ marginTop: 4, borderTop: "1px dashed #d9d9d9", paddingTop: 4 }}>
                 <Text type="danger" strong>Số tiền hoàn dự kiến: {intcomma(productPrice * productQuantity)}đ</Text>
            </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 8 }}>
            Lý do khiếu nại <Text type="danger">*</Text>
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="Ví dụ: Sản phẩm bị vỡ, giao sai màu, thiếu phụ kiện..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              outline: "none",
              resize: "vertical",
              fontSize: 14
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 8 }}>
            Hình ảnh / Video bằng chứng
          </label>
          
          {/* Custom File Input đơn giản */}
          <div style={{ border: "1px dashed #d9d9d9", borderRadius: 8, padding: 16, textAlign: "center", position: 'relative' }}>
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*"
                onChange={(e) => onChangeFiles(e.target.files)}
                style={{ position: 'absolute', width: '100%', height: '100%', top:0, left:0, opacity: 0, cursor: 'pointer' }}
              />
              <InboxOutlined style={{ fontSize: 24, color: "#1890ff" }} />
              <div style={{ marginTop: 8 }}>Nhấn để chọn ảnh hoặc video</div>
          </div>

          {files && files.length > 0 && (
              <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Đã chọn {files.length} tệp:</Text>
                  <ul style={{ paddingLeft: 20, marginTop: 4, fontSize: 13, color: "#595959" }}>
                      {Array.from(files).map((f, index) => (
                          <li key={index}>{f.name}</li>
                      ))}
                  </ul>
              </div>
          )}
        </div>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Đóng</Button>
          <Button
            type="primary"
            danger
            onClick={handleSubmit}
            loading={isLoading}
            icon={<MessageOutlined />}
          >
            Gửi yêu cầu
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ComplaintForm;