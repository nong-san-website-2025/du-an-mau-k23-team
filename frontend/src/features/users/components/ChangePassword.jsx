import React, { useState } from "react";
import { Form, Input, Button, message, Alert, Typography, Space } from "antd";
import { LockOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;

const ChangePassword = () => {
  // Trạng thái cho thông báo (thành công/lỗi)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Khởi tạo instance Form
  const [form] = Form.useForm();

  // Lấy API URL từ env
  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (values) => {
    // values chứa các trường: old_password, new_password, confirm_password

    if (values.new_password !== values.confirm_password) {
      // Logic kiểm tra khớp mật khẩu đã được xử lý bởi Form item 'confirm_password' rule
      return;
    }

    setLoading(true);
    setError(null); // Xóa lỗi trước khi gửi request

    try {
      const token = localStorage.getItem("token");
      
      // SỬ DỤNG ENV Ở ĐÂY
      await axios.post(
        `${API_URL}/users/change-password/`,
        {
          current_password: values.old_password,
          new_password: values.new_password,
          confirm_password: values.confirm_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Thông báo thành công bằng Ant Design message
      message.success("Đổi mật khẩu thành công!");
      
      // Reset form sau khi thành công
      form.resetFields();
    } catch (err) {
      // Xử lý lỗi từ API
      const errorMessage = err.response?.data?.error || "Đã xảy ra lỗi trong quá trình đổi mật khẩu.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minWidth: 900, padding: "24px", border: "1px solid #f0f0f0", borderRadius: 8 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4} style={{ textAlign: "center", marginBottom: 24 }}>
          <LockOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Đổi Mật Khẩu
        </Title>

        {/* Hiển thị lỗi từ server */}
        {error && (
          <Alert 
            message="Lỗi" 
            description={error} 
            type="error" 
            showIcon 
            closable 
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          name="change_password"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          layout="vertical" // Dạng layout chuyên nghiệp, label nằm trên input
          requiredMark={false} // Tùy chọn: Bỏ dấu * mặc định (vì đã có rules)
        >
          {/* Mật khẩu hiện tại */}
          <Form.Item
            label="Mật khẩu hiện tại"
            name="old_password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại!" },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu hiện tại" 
            />
          </Form.Item>

          {/* Mật khẩu mới */}
          <Form.Item
            label="Mật khẩu mới"
            name="new_password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự." }, // Thêm rule cơ bản
            ]}
            hasFeedback // Hiển thị icon feedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu mới" 
            />
          </Form.Item>

          {/* Xác nhận mật khẩu mới */}
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirm_password"
            dependencies={['new_password']} // Phụ thuộc vào new_password để validate
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  // Lỗi không khớp mật khẩu
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Xác nhận mật khẩu mới" 
            />
          </Form.Item>

          {/* Nút Submit */}
          <Form.Item>
            <Button 
              type="primary" // Màu xanh dương mặc định của antd
              htmlType="submit" 
              loading={loading}
              block // Chiếm toàn bộ chiều rộng
              style={{ marginTop: 16 }}
            >
              Đổi Mật Khẩu
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </div>
  );
};

export default ChangePassword;