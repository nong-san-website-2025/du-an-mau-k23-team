// components/ComplaintForm.jsx
import React from "react";
import { Typography, Button, Space } from "antd";
import { MessageOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const ComplaintForm = ({
  visible,
  productId,
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

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
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
          borderRadius: 20,
          padding: isMobile ? 24 : 40,
          maxWidth: isMobile ? "92%" : 520,
          width: "100%",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            cursor: "pointer",
            fontSize: 24,
            color: "#8c8c8c",
            fontWeight: 400,
            border: "none",
            background: "#f5f5f5",
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onClick={onClose}
        >
          ×
        </button>

        <Title level={4} style={{ marginBottom: 24, color: "#262626" }}>
          Gửi khiếu nại sản phẩm
        </Title>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 600, fontSize: 15, display: "block", marginBottom: 8 }}>
            Nội dung khiếu nại <Text type="danger">*</Text>
          </label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => onChangeText(productId, e.target.value)}
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1.5px solid #d9d9d9",
              background: "#fafafa",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, fontSize: 15, display: "block", marginBottom: 8 }}>
            Ảnh/Video minh chứng <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>(không bắt buộc)</Text>
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => onChangeFiles(productId, e.target.files)}
            style={{
              fontSize: 14,
              padding: 10,
              borderRadius: 8,
              border: "1.5px solid #d9d9d9",
              background: "#fafafa",
              width: "100%",
            }}
          />
          {files?.length > 0 && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
              Đã chọn {files.length} tệp
            </Text>
          )}
        </div>

        <Space size="middle" style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose} size="large">Hủy</Button>
          <Button
            type="primary"
            size="large"
            onClick={() => onSubmit(productId, productPrice, productQuantity)}
            loading={isLoading}
            icon={<MessageOutlined />}
          >
            Gửi khiếu nại
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ComplaintForm;