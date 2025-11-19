import React, { useState } from "react";
import { Modal, Form, Input, Button, Space, message, Spin } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const SellerRejectionModal = ({
  visible,
  onClose,
  seller,
  onRejectSuccess,
  loading: externalLoading,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `${process.env.REACT_APP_API_URL}/sellers/${seller.id}/reject/`,
        {
          reason: values.reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success(
        `Đã từ chối cửa hàng "${seller.store_name}" thành công`
      );
      form.resetFields();
      onRejectSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi từ chối cửa hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined
            style={{ color: "#ff4d4f", fontSize: 20 }}
          />
          <span>Từ chối cửa hàng</span>
        </Space>
      }
      visible={visible}
      onCancel={handleCancel}
      width={600}
      footer={null}
      centered
    >
      <Spin spinning={externalLoading || loading}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 500 }}>
            Cửa hàng: <span style={{ color: "#1890ff" }}>{seller?.store_name}</span>
          </p>
          <p style={{ color: "#666", fontSize: 14 }}>
            Vui lòng điền lý do từ chối để thông báo cho chủ cửa hàng
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Form.Item
            label="Lý do từ chối"
            name="reason"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập lý do từ chối",
              },
              {
                min: 10,
                message: "Lý do từ chối phải có ít nhất 10 ký tự",
              },
            ]}
          >
            <Input.TextArea
              placeholder="Nhập lý do từ chối (ví dụ: Thông tin không đầy đủ, cửa hàng trùng lặp, ...)"
              rows={5}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancel} disabled={loading}>
                Hủy
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={loading}
              >
                Xác nhận từ chối
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default SellerRejectionModal;
