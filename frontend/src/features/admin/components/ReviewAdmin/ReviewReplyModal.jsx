import React, { useEffect, useState } from "react";
import { Modal, Form, Input, message, Alert, Button, Space, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

const ReviewReplyModal = ({ visible, review, onClose, onReply }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) form.resetFields();
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onReply(review.id, values.reply_text);
      setSubmitting(false);
      onClose();
    } catch (error) {
      setSubmitting(false);
    }
  };

  if (!review) return null;

  return (
    <Modal
      open={visible}
      title="Phản hồi đánh giá khách hàng"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Hủy bỏ</Button>,
        <Button 
          key="submit" 
          type="primary" 
          icon={<SendOutlined />} 
          loading={submitting} 
          onClick={handleSubmit}
        >
          Gửi phản hồi
        </Button>
      ]}
      width={600}
      centered
    >
      <Alert
        message={`Đang trả lời cho: ${review.user_name}`}
        description={
            <div style={{ fontStyle: 'italic', marginTop: 5, color: '#595959' }}>
               "{review.comment && review.comment.length > 100 
                  ? review.comment.substring(0, 100) + '...' 
                  : review.comment || 'Không có nội dung'}"
            </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="reply_text"
          label={<Text strong>Nội dung trả lời</Text>}
          rules={[
            { required: true, message: "Vui lòng nhập nội dung" },
            { min: 10, message: "Câu trả lời quá ngắn (tối thiểu 10 ký tự)" }
          ]}
        >
          <TextArea
            rows={6}
            placeholder="Ví dụ: Cảm ơn bạn đã tin tưởng ủng hộ shop. Chúng tôi rất vui..."
            showCount
            maxLength={1000}
            style={{ fontSize: 14 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReviewReplyModal;