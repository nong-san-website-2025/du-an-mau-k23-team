// src/components/ProfileInfoV2.jsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  Button,
  Avatar,
  Card,
  Typography,
  Upload,
  message,
  Tooltip,
  Alert,
  Statistic,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ProfileInfo = ({
  form,
  editMode,
  setEditMode,
  handleChange,
  handleSave,
  saving,
  error,
  success,
  user,
  setForm,
  addresses = [],
  onOpenFollowingModal,
  onOpenFollowersModal,
}) => {
  const objectUrlRef = useRef(null);

  // Avatar preview
  const avatarSrc = useMemo(() => {
    if (form?.avatar instanceof File) {
      const url = URL.createObjectURL(form.avatar);
      objectUrlRef.current = url;
      return url;
    }
    return form?.avatar || "/default-avatar.png";
  }, [form?.avatar]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [avatarSrc]);

  const defaultAddress = useMemo(
    () => addresses.find((addr) => addr.is_default)?.location || "---",
    [addresses]
  );

  return (
    <Card
      style={{ border: "none" }}
      bodyStyle={{ padding: 24 }}
      title={
        <Title level={4} style={{ marginBottom: 8 }}>
          Thông tin cá nhân
        </Title>
      }
    >
      {/* Feedback */}
      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Row gutter={[24, 24]}>
        {/* Left: Form */}
        <Col xs={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Tên đăng nhập">
                <Input value={form?.username || ""} disabled />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Họ tên">
                <Input
                  value={form?.full_name || ""}
                  name="full_name"
                  onChange={handleChange}
                  disabled={!editMode}
                  placeholder="Nhập họ tên"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Email">
                {editMode ? (
                  <Input
                    type="email"
                    value={form?.email ?? ""}
                    placeholder={form?.email_masked || "Nhập email mới"}
                    name="email"
                    onChange={handleChange}
                  />
                ) : (
                  <Tooltip
                    title={form?.email || "Email chưa được thiết lập"}
                    placement="topLeft"
                  >
                    <Input value={form?.email_masked || "---"} disabled />
                  </Tooltip>
                )}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Số điện thoại">
                {editMode ? (
                  <Input
                    value={form?.phone ?? ""}
                    placeholder={form?.phone_masked || "Nhập số điện thoại mới"}
                    name="phone"
                    onChange={handleChange}
                  />
                ) : (
                  <Tooltip
                    title={form?.phone || "Số điện thoại chưa được thiết lập"}
                  >
                    <Input value={form?.phone_masked || "---"} disabled />
                  </Tooltip>
                )}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Ngày tạo">
                <Input
                  value={
                    form?.created_at
                      ? new Date(form.created_at).toLocaleDateString("vi-VN")
                      : "---"
                  }
                  disabled
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Địa chỉ mặc định">
                <Input value={defaultAddress} disabled />
              </Form.Item>
            </Col>
          </Row>
        </Col>

        {/* Right: Avatar + Social */}
        <Col
          xs={24}
          md={8}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div style={{ position: "relative" }}>
            <Avatar
              src={avatarSrc}
              size={120}
              style={{
                border: "2px solid #d9d9d9",
                cursor: editMode ? "pointer" : "default",
              }}
              icon={<UserOutlined />}
            />
            {editMode && (
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  setForm((prev) => ({ ...prev, avatar: file }));
                  return false;
                }}
                accept="image/*"
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<UploadOutlined />}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  Chọn ảnh
                </Button>
              </Upload>
            )}
          </div>

          <Row gutter={16} style={{ marginTop: 24, width: "100%" }}>
            <Col span={12}>
              <Card bordered={false} style={{ textAlign: "center", cursor: "pointer" }} onClick={onOpenFollowingModal}>
                <Statistic
                  title="Đang theo dõi"
                  value={form?.followingCount || 0}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card bordered={false} style={{ textAlign: "center", cursor: "pointer" }} onClick={onOpenFollowersModal}>
                <Statistic
                  title="Người theo dõi"
                  value={form?.followersCount || 0}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Buttons */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        {editMode ? (
          <>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            <Button
              onClick={() => {
                setEditMode(false);
                setForm(user);
              }}
            >
              Hủy
            </Button>
          </>
        ) : (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setEditMode(true)}
          >
            Chỉnh sửa hồ sơ
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProfileInfo;
