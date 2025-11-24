import React, { useState, useEffect } from "react";
import { Modal, Form, Input, message, Card, Avatar, Rate, Space, Typography, Divider } from "antd";
import { UserOutlined } from "@ant-design/icons";

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
      title="Trả lời đánh giá khách hàng"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Gửi trả lời"
      confirmLoading={loading}
      width={700}
      okButtonProps={{
        style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
      }}
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
              Sản phẩm: {review.product_name}
            </div>
          </Space>
        </Card>

        {/* Hiển thị các phản hồi trước đó nếu có */}
        {review.replies && review.replies.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Card size="small" title="Các phản hồi trước" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {review.replies.map((reply, index) => (
                  <div key={reply.id || index} style={{
                    padding: 12,
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 6,
                    marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong style={{ color: '#52c41a' }}>
                        {reply.user_name || "Người bán"}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(reply.created_at).toLocaleString('vi-VN')}
                      </Text>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {reply.reply_text}
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          </>
        )}

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
          <Text strong style={{ color: '#52c41a' }}>💡 Mẹo trả lời hiệu quả:</Text>
          <ul style={{ marginTop: 8, color: '#666', paddingLeft: 20 }}>
            <li>Trả lời một cách lịch sự và chân thành</li>
            <li>Cảm ơn khách hàng đã đánh giá</li>
            <li>Giải quyết vấn đề nếu có thể hoặc xin lỗi về sự bất tiện</li>
            <li>Cung cấp thông tin bổ sung về sản phẩm nếu cần</li>
            <li>Tránh tranh cãi hoặc đổ lỗi</li>
          </ul>
        </Card>
      </div>
    </Modal>
  );
};

export default ReviewReplyModal;