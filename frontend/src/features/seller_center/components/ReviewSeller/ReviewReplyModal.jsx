import React, { useState, useEffect } from "react";
import { Modal, Form, Input, message, Alert, Avatar, Rate, Space, Typography, Button } from "antd";
import { UserOutlined, BulbOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

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
      onClose();
    } catch (error) {
      if (!error.errorFields) {
        console.error("Lỗi khi trả lời:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  return (
    <Modal
      open={visible}
      title="Phản hồi khách hàng"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Hủy bỏ</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Gửi phản hồi
        </Button>
      ]}
      width={600}
      centered
    >
      {/* Context Review */}
      <div style={{ padding: '16px', background: '#fafafa', borderRadius: 8, marginBottom: 24 }}>
        <Space align="start">
           <Avatar icon={<UserOutlined />} src={review.user_avatar} />
           <div>
              <Text strong>{review.user_name}</Text>
              <div><Rate disabled value={review.rating} style={{ fontSize: 12 }} /></div>
           </div>
        </Space>
        <Paragraph 
          ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }} 
          style={{ marginTop: 12, marginBottom: 0, color: '#595959', paddingLeft: 40 }}
        >
          "{review.comment || 'Không có nội dung'}"
        </Paragraph>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="reply_text"
          label={<Text strong>Nội dung phản hồi</Text>}
          rules={[
            { required: true, message: "Vui lòng nhập nội dung" },
            { min: 10, message: "Nội dung quá ngắn (tối thiểu 10 ký tự)" }
          ]}
        >
          <TextArea
            rows={5}
            placeholder="Cảm ơn bạn đã ủng hộ shop..."
            showCount
            maxLength={500}
            style={{ fontSize: 15 }}
          />
        </Form.Item>
      </Form>

      <Alert
        message="Mẹo phản hồi chuyên nghiệp"
        description={
          <ul style={{ paddingLeft: 20, margin: 0 }}>
             <li>Luôn bắt đầu bằng lời cảm ơn hoặc xin lỗi chân thành.</li>
             <li>Giải quyết trực tiếp vấn đề khách hàng nêu ra.</li>
             <li>Giữ thái độ tích cực, tránh tranh cãi công khai.</li>
          </ul>
        }
        type="info"
        showIcon
        icon={<BulbOutlined />}
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

export default ReviewReplyModal;