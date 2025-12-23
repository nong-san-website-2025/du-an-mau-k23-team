// src/components/ProfileInfoV2.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
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
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Badge, Tag, Space, Divider, Descriptions, Empty, InputNumber } from "antd";
import { initializeRecaptcha, sendPhoneOTP, verifyPhoneOTP, resetRecaptcha } from "../../../services/firebasePhoneAuth";

const { Title, Text } = Typography;

const ProfileInfo = ({
  form,
  handleChange,
  handleSave,
  saving = false,
  error = null,
  success = null,
  user,
  setForm,
  addresses = [],
  onOpenFollowingModal = () => {},
  onOpenFollowersModal = () => {},
}) => {
  const objectUrlRef = useRef(null);
  const [editingFields, setEditingFields] = useState({});
  const [tempForm, setTempForm] = useState(form);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  useEffect(() => {
    setTempForm(form);
  }, [form]);

  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  const handleResendEmailVerification = async () => {
    if (!form?.pending_email) return;
    setResendingEmail(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      // Ensure we don't double-append /api if API_BASE_URL already has it
      const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
      
      await fetch(`${baseUrl}/users/me/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.pending_email }),
      });
      
      message.success("Đã gửi lại email xác thực!");
    } catch (err) {
      message.error("Không thể gửi lại email. Vui lòng thử lại!");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleRequestPhoneOtp = async () => {
    if (!form?.pending_phone) return;
    setVerifyingPhone(true);
    try {
      initializeRecaptcha();
      const result = await sendPhoneOTP(form.pending_phone);
      window.confirmationResult = result;
      
      message.success("Mã OTP đã được gửi qua SMS");
      setOtpCountdown(60);
      
      const timer = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error sending OTP:", err);
      let errorMessage = "Lỗi khi gửi OTP. Vui lòng thử lại!";
      if (err.message === "reCAPTCHA chưa được khởi tạo") {
        errorMessage = "Lỗi khởi tạo reCAPTCHA. Vui lòng tải lại trang.";
      } else if (err.code === "auth/invalid-phone-number") {
        errorMessage = "Số điện thoại không hợp lệ";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Quá nhiều yêu cầu, vui lòng thử lại sau";
      }
      message.error(errorMessage);
      setVerifyingPhone(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) {
      message.error("Vui lòng nhập mã OTP");
      return;
    }
    setVerifyingPhoneOtp(true);
    try {
      const verifyResult = await verifyPhoneOTP(phoneOtp);
      
      if (verifyResult.success) {
        const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("token");
        
        // Ensure we don't double-append /api if API_BASE_URL already has it
        const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
        
        const res = await fetch(`${baseUrl}/users/me/`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            phone: form.pending_phone,
            pending_phone: null,
            firebase_id_token: verifyResult.idToken
          }),
        });

        if (res.ok) {
          message.success("Xác thực số điện thoại thành công!");
          setVerifyingPhone(false);
          setPhoneOtp("");
          setOtpCountdown(0);
          setForm(prev => ({ ...prev, phone: form.pending_phone, pending_phone: null }));
          resetRecaptcha();
        } else {
          message.error("Không thể cập nhật số điện thoại");
        }
      } else {
        message.error(verifyResult.error);
      }
    } catch (err) {
      message.error("Xác thực thất bại. Vui lòng thử lại!");
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const isFieldEditing = (fieldName) => editingFields[fieldName] || false;

  const startEditing = (fieldName) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const cancelEditing = (fieldName) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: false }));
    setTempForm(form);
  };

  const saveField = async (fieldName) => {
    try {
      await handleSave({ preventDefault: () => {} });
      setEditingFields((prev) => ({ ...prev, [fieldName]: false }));
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setTempForm((prev) => ({ ...prev, [name]: value }));
    handleChange(e);
  };

  // Avatar preview
  const avatarSrc = useMemo(() => {
    if (tempForm?.avatar instanceof File) {
      const url = URL.createObjectURL(tempForm.avatar);
      objectUrlRef.current = url;
      return url;
    }
    return tempForm?.avatar || null;
  }, [tempForm?.avatar]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [avatarSrc]);

  const defaultAddress = useMemo(
    () => addresses.find((addr) => addr.is_default)?.location || "---",
    [addresses]
  );

  const renderEditableField = (fieldName, label, value, placeholder = "") => (
    <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
      <Input
        value={value || ""}
        name={fieldName}
        onChange={handleFieldChange}
        disabled={!isFieldEditing(fieldName)}
        placeholder={placeholder}
        size="large"
        style={{
          flex: 1,
          borderRadius: 6,
        }}
      />
      {!isFieldEditing(fieldName) ? (
        <Button
          type="primary"
          size="large"
          icon={<EditOutlined />}
          onClick={() => startEditing(fieldName)}
          style={{ width: 40 }}
        />
      ) : (
        <>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={() => saveField(fieldName)}
            loading={saving}
            style={{ width: 40 }}
          />
          <Button
            danger
            size="large"
            icon={<CloseOutlined />}
            onClick={() => cancelEditing(fieldName)}
            style={{ width: 40 }}
          />
        </>
      )}
    </div>
  );

  return (
    <Card
      style={{ border: "none" }}
      styles={{ body: { padding: 24 } }}
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

      <div id="recaptcha-container"></div>

      {form?.pending_email && (
        <Alert
          message={
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClockCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
                <strong>Email chờ xác thực</strong>
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Bạn đã yêu cầu đổi email thành <strong>{form.pending_email}</strong>. Vui lòng kiểm tra hộp thư để xác thực.
              </div>
              <Button
                type="link"
                size="small"
                icon={<MailOutlined />}
                onClick={handleResendEmailVerification}
                loading={resendingEmail}
              >
                Gửi lại email xác thực
              </Button>
            </Space>
          }
          type="warning"
          style={{ marginBottom: 16 }}
          showIcon={false}
        />
      )}

      <Row gutter={[32, 32]}>
        {/* Left: Avatar + Stats */}
        <Col xs={24} md={8}>
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                src={avatarSrc}
                size={140}
                style={{
                  border: "3px solid #1890ff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
                icon={<UserOutlined />}
              />
              {!isFieldEditing("avatar") ? (
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => startEditing("avatar")}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    display: "flex",
                    gap: 4,
                  }}
                >
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      setTempForm((prev) => ({ ...prev, avatar: file }));
                      setForm((prev) => ({ ...prev, avatar: file }));
                      return false;
                    }}
                    accept="image/*"
                  >
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      icon={<UploadOutlined />}
                    />
                  </Upload>
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<SaveOutlined />}
                    onClick={() => saveField("avatar")}
                    loading={saving}
                  />
                  <Button
                    danger
                    shape="circle"
                    size="large"
                    icon={<CloseOutlined />}
                    onClick={() => cancelEditing("avatar")}
                  />
                </div>
              )}
            </div>

            <Title level={5} style={{ marginTop: 16, marginBottom: 4 }}>
              {form?.full_name || form?.username}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              @{form?.username}
            </Text>

            <Divider />

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card
                  variant="borderless"
                  style={{
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  onClick={onOpenFollowingModal}
                  hoverable
                >
                  <Statistic
                    title="Theo dõi"
                    value={form?.followingCount || 0}
                    valueStyle={{ color: "#52c41a", fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  variant="borderless"
                  style={{
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  onClick={onOpenFollowersModal}
                  hoverable
                >
                  <Statistic
                    title="Follower"
                    value={form?.followersCount || 0}
                    valueStyle={{ color: "#fa8c16", fontSize: 20 }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Right: Form */}
        <Col xs={24} md={16}>
          <Form layout="vertical">
            <Form.Item label="Tên đăng nhập">
              <Input
                value={form?.username || ""}
                disabled
                size="large"
                prefix={<UserOutlined />}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Form.Item label="Họ tên">
              {renderEditableField("full_name", "Họ tên", tempForm?.full_name, "Nhập họ tên")}
            </Form.Item>

            <Form.Item
              label={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MailOutlined />
                  <span>Email</span>
                  {form?.pending_email ? (
                    <Tag color="warning" icon={<ClockCircleOutlined />}>
                      Chờ xác thực
                    </Tag>
                  ) : form?.email ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Đã xác thực
                    </Tag>
                  ) : null}
                </div>
              }
            >
              {isFieldEditing("email") ? (
                renderEditableField("email", "Email", tempForm?.email, "Nhập email mới")
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                  <Input
                    value={form?.email || "---"}
                    disabled
                    size="large"
                    style={{ flex: 1, borderRadius: 6 }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => startEditing("email")}
                    style={{ width: 40 }}
                  />
                </div>
              )}
            </Form.Item>

            <Form.Item
              label={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PhoneOutlined />
                  <span>Số điện thoại</span>
                  {form?.pending_phone ? (
                    <Tag color="warning" icon={<ClockCircleOutlined />}>
                      Chờ xác thực
                    </Tag>
                  ) : form?.phone ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Đã xác thực
                    </Tag>
                  ) : null}
                </div>
              }
            >
              {verifyingPhone && form?.pending_phone ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Alert
                    message={`Mã OTP đã được gửi tới ${form.pending_phone}`}
                    type="info"
                    showIcon
                  />
                  <Input
                    placeholder="Nhập mã OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    size="large"
                    maxLength={6}
                    style={{ borderRadius: 6 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      type="default"
                      disabled={otpCountdown > 0}
                      onClick={handleRequestPhoneOtp}
                      loading={otpCountdown > 0}
                      style={{ flex: 1 }}
                    >
                      {otpCountdown > 0 ? `Lấy lại OTP (${otpCountdown}s)` : "Lấy lại OTP"}
                    </Button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      type="default"
                      onClick={() => {
                        setVerifyingPhone(false);
                        setPhoneOtp("");
                        setOtpCountdown(0);
                      }}
                      style={{ flex: 1 }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleVerifyPhoneOtp}
                      loading={verifyingPhoneOtp}
                      style={{ flex: 1 }}
                    >
                      Xác nhận
                    </Button>
                  </div>
                </div>
              ) : isFieldEditing("phone") ? (
                renderEditableField("phone", "Số điện thoại", tempForm?.phone, "Nhập số điện thoại mới")
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                  <Input
                    value={form?.pending_phone || form?.phone || "---"}
                    disabled
                    size="large"
                    style={{ flex: 1, borderRadius: 6 }}
                  />
                  {form?.pending_phone && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => {
                        setVerifyingPhone(true);
                        handleRequestPhoneOtp();
                      }}
                    >
                      Xác thực
                    </Button>
                  )}
                  <Button
                    type="primary"
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => startEditing("phone")}
                    style={{ width: 40 }}
                  />
                </div>
              )}
            </Form.Item>

            <Divider />

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Ngày tạo">
                  <Input
                    value={
                      form?.created_at
                        ? new Date(form.created_at).toLocaleDateString("vi-VN")
                        : "---"
                    }
                    disabled
                    size="large"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Địa chỉ mặc định">
                  <Input
                    value={defaultAddress}
                    disabled
                    size="large"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>


    </Card>
  );
};

ProfileInfo.propTypes = {
  form: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.string,
  user: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  addresses: PropTypes.array,
  onOpenFollowingModal: PropTypes.func,
  onOpenFollowersModal: PropTypes.func,
};

export default ProfileInfo;