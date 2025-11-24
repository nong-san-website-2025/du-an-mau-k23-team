import React, { useState, useEffect } from "react";
import { Modal, Form, Input, message, Card, Avatar, Rate, Space, Typography } from "antd";
import { UserOutlined, ShopOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

const ReviewReplyModal = ({ visible, review, onClose, onReply }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && review) {
      form.resetFields();
    }
  }, [visible, review, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await onReply(review.id, values.reply_text);

      message.success("Trả lời đánh giá thành công!");
      onClose();
      form.resetFields();
    } catch (error) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      console.error("Lỗi khi trả lời:", error);
      message.error("Không thể trả lời đánh giá");
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  return (
    <Modal
      open={visible}
      title="Trả lời đánh giá"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Gửi trả lời"
      confirmLoading={loading}
      width={700}
    >
      <div style={{ marginBottom: 20 }}>
        {/* Hiển thị đánh giá gốc */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Avatar icon={<UserOutlined />} size="small" />
              <div>
                <Text strong>{review.user_name}</Text>
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                  {new Date(review.created_at).toLocaleString('vi-VN')}
                </Text>
              </div>
            </Space>

            <Space>
              <Rate disabled value={review.rating} style={{ fontSize: '14px' }} />
              <Text>{review.rating}/5 sao</Text>
            </Space>

            <div style={{
              padding: 12,
              backgroundColor: '#f9f9f9',
              borderRadius: 4,
              whiteSpace: 'pre-wrap'
            }}>
              {review.comment || "Không có nội dung"}
            </div>

            <div style={{ fontSize: '12px', color: '#666' }}>
              Sản phẩm: {review.product_name} - Cửa hàng: {review.seller_store_name}
            </div>
          </Space>
        </Card>

        {/* Form trả lời */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="reply_text"
            label="Nội dung trả lời"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung trả lời" },
              { min: 10, message: "Nội dung trả lời phải có ít nhất 10 ký tự" }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Nhập nội dung trả lời cho đánh giá này..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Form>

        {/* Hướng dẫn */}
        <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Text strong style={{ color: '#52c41a' }}>💡 Mẹo:</Text>
          <ul style={{ marginTop: 8, color: '#666' }}>
            <li>Trả lời một cách lịch sự và chuyên nghiệp</li>
            <li>Giải quyết vấn đề của khách hàng nếu có thể</li>
            <li>Cung cấp thông tin hữu ích về sản phẩm</li>
            <li>Tránh tranh cãi hoặc ngôn ngữ tiêu cực</li>
          </ul>
        </Card>
      </div>
    </Modal>
  );
};

export default ReviewReplyModal;