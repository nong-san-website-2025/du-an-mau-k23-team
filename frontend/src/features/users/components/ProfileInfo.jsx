import React, { useEffect, useMemo, useRef } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  Button,
  Avatar,
  Badge,
  Card,
  Typography,
  Upload,
  message,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const ProfileInfo = ({
  form,
  editMode,
  setEditMode,
  handleChange,
  handleSave,
  saving,
  error,
  user,
  setForm,
  addresses = [],
}) => {
  const objectUrlRef = useRef(null);

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
      title={
        <Title level={4} className="text-dark" style={{ marginBottom: 0 }}> Thông tin cá nhân
        </Title>
      }
      className=""
      style={{ border: "none"  }}
    >
      <Row gutter={[16, 16]} style={{ minHeight: "300px" }}>
        {/* Left 3/5 */}
        <Col xs={24} md={14}>
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
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Email">
                {editMode ? (
                  <Input
                    type="email"
                    value={form?.email ?? ""}
                    placeholder={
                      form?.email_masked || "Nhập email mới nếu muốn thay đổi"
                    }
                    name="email"
                    onChange={handleChange}
                  />
                ) : (
                  <Input
                    value={form?.email_masked || "---"}
                    disabled
                  />
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
              <Form.Item label="Số điện thoại">
                {editMode ? (
                  <Input
                    type="text"
                    value={form?.phone ?? ""}
                    placeholder={
                      form?.phone_masked || "Nhập số điện thoại mới nếu muốn thay đổi"
                    }
                    name="phone"
                    onChange={handleChange}
                  />
                ) : (
                  <Input
                    value={form?.phone_masked || "---"}
                    disabled
                  />
                )}
              </Form.Item>
            </Col>
          </Row>
        </Col>

        {/* Right 2/5 */}
        <Col
          xs={24}
          md={10}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <Avatar
              src={avatarSrc}
              size={100}
              style={{
                border: "2px solid #2E8B57",
              }}
              icon={!avatarSrc && <UserOutlined />}
            />
            {editMode && (
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleChange({ target: { name: "avatar", files: [file] } });
                  return false; // không upload tự động
                }}
                accept="image/*"
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<UploadOutlined />}
                  style={{
                    position: "absolute",
                    bottom: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  Chọn ảnh
                </Button>
              </Upload>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            <Badge count={form?.followingCount ?? 0 } color="green">
              <Button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("openFollowingModal"))
                }
              >
                Đang theo dõi
              </Button>
            </Badge>
            <Badge count={form?.followersCount ?? 0} color="orange">
              <Button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("openFollowersModal"))
                }
              >
                Người theo dõi
              </Button>
            </Badge>
          </div>
        </Col>
      </Row>

      {error && (
        <div style={{ marginTop: "16px" }}>
          <Card type="inner" style={{ borderColor: "red" }}>
            <Typography.Text type="danger">{error}</Typography.Text>
          </Card>
        </div>
      )}

      {/* Buttons */}
      <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
              icon={<CloseOutlined />}
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
            Chỉnh sửa thông tin
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProfileInfo;
