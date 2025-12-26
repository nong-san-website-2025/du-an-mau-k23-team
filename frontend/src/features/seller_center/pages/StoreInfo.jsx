"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Form,
  Input,
  Upload,
  Button,
  Row,
  Col,
  Typography,
  message,
  Skeleton,
  Avatar,
  Space,
  Tag,
  Divider,
  theme,
} from "antd";
import {
  ShopOutlined,
  CameraOutlined,
  SaveOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import sellerService from "../services/api/sellerService";
import "../styles/StoreInfo.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

// Helper để validate ảnh (Senior tip: Tách logic validation ra ngoài)
const beforeUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    message.error("Chỉ chấp nhận file ảnh JPG/PNG!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Ảnh phải nhỏ hơn 2MB!");
  }
  return isJpgOrPng && isLt2M;
};

export default function StoreManagement() {
  const { token } = useToken(); // Sử dụng token để UI đồng bộ với theme hệ thống
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sellerId, setSellerId] = useState(null);

  // State quản lý ảnh preview
  const [previewImage, setPreviewImage] = useState(null);
  const [fileList, setFileList] = useState([]);

  // Fetch dữ liệu
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const me = await sellerService.getMe();
        if (!mounted) return;

        setSellerId(me.id);

        // Fill data vào form instance
        form.setFieldsValue({
          store_name: me.store_name,
          bio: me.bio,
          address: me.address,
          phone: me.phone,
        });

        // Set ảnh mặc định từ server
        if (me.image) {
          setPreviewImage(me.image);
        }
      } catch (error) {
        console.error("Error fetching store info:", error);
        message.error("Không thể tải thông tin cửa hàng. Vui lòng thử lại!");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    // Clean up memory leak khi unmount (Senior tip)
    return () => {
      mounted = false;
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [form]);

  // Xử lý thay đổi ảnh
  const handleImageChange = ({ fileList: newFileList, file }) => {
    // Chỉ lấy file mới nhất
    const latestFile = newFileList[newFileList.length - 1];

    if (latestFile && latestFile.originFileObj) {
      const objectUrl = URL.createObjectURL(latestFile.originFileObj);
      setPreviewImage(objectUrl);
      setFileList([latestFile]); // Giữ lại file object để gửi lên server
    }
  };

  // Submit Form
  const onFinish = async (values) => {
    if (!sellerId) return;

    setSubmitting(true);
    try {
      // Sử dụng FormData để handle multipart/form-data
      const payload = new FormData();
      Object.keys(values).forEach((key) => {
        if (values[key]) payload.append(key, values[key]);
      });

      // Nếu có file ảnh mới thì append vào
      if (fileList.length > 0 && fileList[0].originFileObj) {
        payload.append("image", fileList[0].originFileObj);
      }

      const updatedData = await sellerService.update(sellerId, payload);

      message.success({
        content: "Cập nhật cửa hàng thành công!",
        key: "update_store",
      });

      // Update lại form state với dữ liệu mới nhất từ server trả về
      form.setFieldsValue(updatedData);
    } catch (error) {
      console.error(error);
      message.error({
        content: "Lỗi cập nhật. Vui lòng thử lại!",
        key: "update_store",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Sections ---

  // Loading Skeleton
  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <Skeleton active avatar paragraph={{ rows: 1 }} />
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Skeleton.Node active style={{ width: "100%", height: 300 }} />
          </Col>
          <Col span={16}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1200,
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 0 }}>
          Hồ sơ Cửa hàng
        </Title>
        <Text type="secondary">
          Quản lý thông tin hiển thị và thương hiệu của bạn trên sàn thương mại
          điện tử.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <Row gutter={[24, 24]}>
          {/* Left Column: Branding Identity */}
          <Col xs={24} lg={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: token.borderRadiusLG,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                textAlign: "center",
                height: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 24,
                }}
              >
                <Avatar
                  size={140}
                  src={previewImage}
                  icon={<UserOutlined />}
                  style={{
                    border: `4px solid ${token.colorBgContainer}`,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  }}
                />

                {/* Upload Overlay Button */}
                <Upload
                  name="avatar"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleImageChange}
                  accept="image/*"
                >
                  <Button
                    shape="circle"
                    type="primary"
                    icon={<CameraOutlined />}
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 10,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                </Upload>
              </div>

              <Title level={4} style={{ marginBottom: 4 }}>
                {form.getFieldValue("store_name") || "Tên Cửa Hàng"}
              </Title>
              <Tag color="green" style={{ marginBottom: 16 }}>
                Đã xác thực
              </Tag>

              <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                {form.getFieldValue("bio") || "Chưa có mô tả giới thiệu."}
              </Paragraph>

              <Divider dashed />

              <div style={{ textAlign: "left", padding: "0 12px" }}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: token.colorTextSecondary,
                    }}
                  >
                    <ShopOutlined style={{ marginRight: 12, fontSize: 16 }} />
                    <Text>ID: #{sellerId?.toString().padStart(6, "0")}</Text>
                  </div>
                  {/* Có thể thêm các thống kê nhanh ở đây */}
                </Space>
              </div>
            </Card>
          </Col>

          {/* Right Column: Edit Form */}
          <Col xs={24} lg={16}>
            <Card
              title="Thông tin chi tiết"
              bordered={false}
              style={{
                borderRadius: token.borderRadiusLG,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
              extra={
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  size="large"
                  className="store-save-btn"
                >
                  Lưu thay đổi
                </Button>
              }
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="store_name"
                    label="Tên cửa hàng"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên cửa hàng!",
                      },
                      { min: 5, message: "Tên cửa hàng tối thiểu 5 ký tự" },
                    ]}
                  >
                    <Input
                      prefix={<ShopOutlined className="site-form-item-icon" />}
                      placeholder="Nhập tên cửa hàng của bạn"
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    name="bio"
                    label="Giới thiệu (Bio)"
                    tooltip="Mô tả ngắn gọn giúp khách hàng hiểu rõ hơn về sản phẩm của bạn."
                  >
                    <TextArea
                      rows={4}
                      placeholder="VD: Chuyên cung cấp nông sản sạch Đà Lạt, cam kết chất lượng..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                Thông tin liên hệ
              </Divider>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại!",
                      },
                      {
                        pattern: /^[0-9]{10,11}$/,
                        message: "Số điện thoại không hợp lệ!",
                      },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="0909xxxxxx"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  {/* Ví dụ thêm field Email nếu cần - Senior dev luôn nghĩ về khả năng mở rộng */}
                  <Form.Item label="Email liên hệ (Tự động)">
                    <Input
                      prefix={<MailOutlined />}
                      disabled
                      placeholder="store@example.com"
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    name="address"
                    label="Địa chỉ kho hàng"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ!" },
                    ]}
                  >
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Nhập địa chỉ cụ thể"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
