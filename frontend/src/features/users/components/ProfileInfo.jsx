// src/components/ProfileInfoV2.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Row, Col, Form, Input, Button, Avatar, Card, Typography, Upload,
  message, Alert, Statistic, Tag, Space, Divider
} from "antd";
import {
  UserOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  UploadOutlined, CheckCircleOutlined, ClockCircleOutlined,
  MailOutlined, PhoneOutlined
} from "@ant-design/icons";
import { initializeRecaptcha, sendPhoneOTP, verifyPhoneOTP, resetRecaptcha } from "../../../services/firebasePhoneAuth";

const { Title, Text } = Typography;

// Helper function để lấy Base URL, tránh lặp code
const getApiBaseUrl = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  return API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
};

const ProfileInfo = ({
  form,
  handleChange,
  handleSave,
  saving = false,
  error = null,
  success = null,
  setForm,
  addresses = [],
  onOpenFollowingModal = () => {},
  onOpenFollowersModal = () => {},
}) => {
  // --- States ---
  const objectUrlRef = useRef(null);
  const recaptchaWrapperRef = useRef(null); // Ref để bọc recaptcha tránh lỗi DOM
  const [editingFields, setEditingFields] = useState({});
  const [tempForm, setTempForm] = useState(form);
  
  // OTP & Verify States
  const [resendingEmail, setResendingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  // --- Effects ---

  // Sync props form to local tempForm
  useEffect(() => {
    setTempForm(form);
  }, [form]);

  // Cleanup Avatar Object URL để tránh memory leak
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [tempForm?.avatar]);

  // Cleanup Recaptcha khi unmount
  useEffect(() => {
    return () => {
      resetRecaptcha();
      // Clear interval nếu component unmount khi đang đếm ngược
      if (window.otpTimer) clearInterval(window.otpTimer);
    };
  }, []);

  // --- Handlers ---

  const handleResendEmailVerification = async () => {
    if (!form?.pending_email) return;
    setResendingEmail(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiBaseUrl()}/users/me/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.pending_email }),
      });
      
      if(res.ok) message.success("Đã gửi lại email xác thực!");
      else throw new Error("Gửi thất bại");
    } catch (err) {
      message.error("Không thể gửi lại email. Vui lòng thử lại!");
    } finally {
      setResendingEmail(false);
    }
  };

  const startOtpCountdown = () => {
    setOtpCountdown(60);
    // Gán vào window để cleanup dễ dàng nếu cần, hoặc dùng useRef cho timer
    window.otpTimer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(window.otpTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestPhoneOtp = async () => {
    if (!form?.pending_phone) return;
    
    // Nếu đang đếm ngược thì không gửi lại
    if (otpCountdown > 0) return;

    try {
      // Reset trước khi init để đảm bảo sạch sẽ
      resetRecaptcha();
      initializeRecaptcha(); 
      
      const result = await sendPhoneOTP(form.pending_phone);
      window.confirmationResult = result;
      
      message.success("Mã OTP đã được gửi qua SMS");
      startOtpCountdown();
    } catch (err) {
      console.error("Error sending OTP:", err);
      let errorMessage = "Lỗi khi gửi OTP. Vui lòng thử lại!";
      if (err.code === "auth/invalid-phone-number") errorMessage = "Số điện thoại không hợp lệ";
      else if (err.code === "auth/too-many-requests") errorMessage = "Quá nhiều yêu cầu, vui lòng thử lại sau";
      
      message.error(errorMessage);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) return message.error("Vui lòng nhập mã OTP");
    
    setVerifyingPhoneOtp(true);
    try {
      const verifyResult = await verifyPhoneOTP(phoneOtp);
      
      if (verifyResult.success) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${getApiBaseUrl()}/users/me/`, {
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
          if (window.otpTimer) clearInterval(window.otpTimer);
          
          // Update Form State ngay lập tức để UI phản hồi
          setForm(prev => ({ ...prev, phone: form.pending_phone, pending_phone: null }));
        } else {
          message.error("Không thể cập nhật số điện thoại vào hệ thống");
        }
      } else {
        message.error(verifyResult.error || "Mã OTP không đúng");
      }
    } catch (err) {
      message.error("Xác thực thất bại. Vui lòng thử lại!");
    } finally {
      setVerifyingPhoneOtp(false);
      resetRecaptcha(); // Reset sau khi verify xong
    }
  };

  // --- Inline Edit Logic ---

  const isFieldEditing = (fieldName) => editingFields[fieldName] || false;

  const startEditing = (fieldName) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const cancelEditing = (fieldName) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: false }));
    setTempForm(form); // Revert value
  };

  const saveField = async (fieldName) => {
    try {
        // Truyền event giả để tương thích với hàm handleSave cũ của bạn
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

  // --- Render Helpers ---

  const avatarSrc = useMemo(() => {
    if (tempForm?.avatar instanceof File) {
      const url = URL.createObjectURL(tempForm.avatar);
      objectUrlRef.current = url;
      return url;
    }
    return tempForm?.avatar || null;
  }, [tempForm?.avatar]);

  const renderEditableField = (fieldName, label, value, placeholder = "") => (
    <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
      <Input
        value={value || ""}
        name={fieldName}
        onChange={handleFieldChange}
        disabled={!isFieldEditing(fieldName)}
        placeholder={placeholder}
        size="large"
        style={{ flex: 1, borderRadius: 6 }}
        // Cho phép ấn Enter để save luôn cho tiện
        onPressEnter={() => isFieldEditing(fieldName) && saveField(fieldName)}
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

  const defaultAddress = useMemo(
    () => addresses.find((addr) => addr.is_default)?.location || "---",
    [addresses]
  );

  return (
    <Card
      style={{ border: "none" }}
      styles={{ body: { padding: 24 } }}
      title={<Title level={4} style={{ marginBottom: 8 }}>Thông tin cá nhân</Title>}
    >
      {/* Error/Success Messages */}
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}
      {success && <Alert type="success" message={success} style={{ marginBottom: 16 }} showIcon />}

      {/* Recaptcha Container - Ẩn đi để không phá layout */}
      <div ref={recaptchaWrapperRef}>
        <div id="recaptcha-container"></div>
      </div>

      {/* Pending Email Alert */}
      {form?.pending_email && (
        <Alert
          message={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <ClockCircleOutlined style={{ color: "#faad14" }} />
                <Text strong>Email chờ xác thực: {form.pending_email}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 13 }}>Vui lòng kiểm tra hộp thư.</Text>
              <Button 
                type="link" size="small" icon={<MailOutlined />} 
                onClick={handleResendEmailVerification} loading={resendingEmail}
                style={{ paddingLeft: 0 }}
              >
                Gửi lại email xác thực
              </Button>
            </Space>
          }
          type="warning" style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[32, 32]}>
        {/* Left Col: Avatar & Stats */}
        <Col xs={24} md={8}>
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                src={avatarSrc}
                size={140}
                style={{ border: "3px solid #1890ff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                icon={<UserOutlined />}
              />
              
              {isFieldEditing("avatar") ? (
                 <div style={{ position: "absolute", bottom: 0, right: 0, display: "flex", gap: 4 }}>
                   <Upload
                     showUploadList={false}
                     accept="image/*"
                     beforeUpload={(file) => {
                       setTempForm((prev) => ({ ...prev, avatar: file }));
                       setForm((prev) => ({ ...prev, avatar: file })); // Update parent form too just in case
                       return false;
                     }}
                   >
                     <Button type="primary" shape="circle" size="large" icon={<UploadOutlined />} />
                   </Upload>
                   <Button type="primary" shape="circle" size="large" icon={<SaveOutlined />} onClick={() => saveField("avatar")} loading={saving} />
                   <Button danger shape="circle" size="large" icon={<CloseOutlined />} onClick={() => cancelEditing("avatar")} />
                 </div>
              ) : (
                <Button
                  type="primary" shape="circle" size="large" icon={<EditOutlined />}
                  onClick={() => startEditing("avatar")}
                  style={{ position: "absolute", bottom: 0, right: 0 }}
                />
              )}
            </div>

            <Title level={5} style={{ marginTop: 16, marginBottom: 4 }}>
              {form?.full_name || form?.username}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>@{form?.username}</Text>

            <Divider />

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card variant="borderless" hoverable onClick={onOpenFollowingModal} style={{ cursor: 'pointer' }}>
                  <Statistic title="Theo dõi" value={form?.followingCount || 0} valueStyle={{ color: "#52c41a" }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card variant="borderless" hoverable onClick={onOpenFollowersModal} style={{ cursor: 'pointer' }}>
                  <Statistic title="Follower" value={form?.followersCount || 0} valueStyle={{ color: "#fa8c16" }} />
                </Card>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Right Col: Form Fields */}
        <Col xs={24} md={16}>
          <Form layout="vertical">
            <Form.Item label="Tên đăng nhập">
              <Input value={form?.username || ""} disabled size="large" prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item label="Họ tên">
              {renderEditableField("full_name", "Họ tên", tempForm?.full_name, "Nhập họ tên")}
            </Form.Item>

            <Form.Item label={
              <Space>
                <MailOutlined /> <span>Email</span>
                {form?.pending_email ? <Tag color="warning">Chờ xác thực</Tag> : form?.email && <Tag color="success">Đã xác thực</Tag>}
              </Space>
            }>
               {isFieldEditing("email") 
                  ? renderEditableField("email", "Email", tempForm?.email, "Nhập email mới")
                  : <div style={{ display: "flex", gap: 8 }}>
                      <Input value={form?.email || "---"} disabled size="large" style={{ flex: 1 }} />
                      <Button type="primary" size="large" icon={<EditOutlined />} onClick={() => startEditing("email")} />
                    </div>
               }
            </Form.Item>

            <Form.Item label={
              <Space>
                <PhoneOutlined /> <span>Số điện thoại</span>
                {form?.pending_phone ? <Tag color="warning">Chờ xác thực</Tag> : form?.phone && <Tag color="success">Đã xác thực</Tag>}
              </Space>
            }>
              {verifyingPhone && form?.pending_phone ? (
                // --- OTP Verification Block ---
                <Card size="small" style={{ background: '#f9f9f9' }}>
                  <Alert message={`OTP đã gửi tới ${form.pending_phone}`} type="info" showIcon style={{marginBottom: 12}} />
                  <Input 
                    placeholder="Nhập mã OTP (6 số)" 
                    value={phoneOtp} 
                    onChange={(e) => setPhoneOtp(e.target.value)} 
                    maxLength={6} 
                    size="large" 
                    style={{ marginBottom: 12 }} 
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button onClick={() => {
                        setVerifyingPhone(false);
                        setPhoneOtp("");
                        resetRecaptcha();
                    }}>Hủy</Button>
                    <Button disabled={otpCountdown > 0} onClick={handleRequestPhoneOtp} loading={otpCountdown > 0}>
                       {otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : "Gửi lại OTP"}
                    </Button>
                    <Button type="primary" onClick={handleVerifyPhoneOtp} loading={verifyingPhoneOtp}>Xác nhận</Button>
                  </div>
                </Card>
              ) : isFieldEditing("phone") ? (
                renderEditableField("phone", "Số điện thoại", tempForm?.phone, "Nhập SĐT mới")
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <Input value={form?.pending_phone || form?.phone || "---"} disabled size="large" style={{ flex: 1 }} />
                  {form?.pending_phone && (
                     <Button type="primary" size="large" onClick={() => {
                         setVerifyingPhone(true);
                         handleRequestPhoneOtp(); // Auto gửi OTP khi bấm Verify
                     }}>
                       Xác thực ngay
                     </Button>
                  )}
                  <Button type="primary" size="large" icon={<EditOutlined />} onClick={() => startEditing("phone")} />
                </div>
              )}
            </Form.Item>

            <Divider />

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Ngày tạo">
                  <Input value={form?.created_at ? new Date(form.created_at).toLocaleDateString("vi-VN") : "---"} disabled size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Địa chỉ mặc định">
                  <Input value={defaultAddress} disabled size="large" />
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
  setForm: PropTypes.func.isRequired,
  addresses: PropTypes.array,
  onOpenFollowingModal: PropTypes.func,
  onOpenFollowersModal: PropTypes.func,
};

export default ProfileInfo;