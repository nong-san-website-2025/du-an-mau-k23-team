// components/SuccessModal.jsx
import React from "react";
import { Modal, Button, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const SuccessModal = ({ open, onCancel, isMobile }) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" type="primary" onClick={onCancel} size="large">
          Đã hiểu
        </Button>,
      ]}
      centered
      width={isMobile ? "90%" : 480}
    >
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a", marginBottom: 16 }} />
        <Title level={4} style={{ marginBottom: 12 }}>Gửi khiếu nại thành công!</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Chúng tôi sẽ xử lý trong vòng 24-48 giờ và thông báo qua email.
        </Text>
      </div>
    </Modal>
  );
};

export default SuccessModal;