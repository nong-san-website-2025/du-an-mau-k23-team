import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Spin,
  Steps,
  Result,
  Row,
  Col,
  Typography,
  Card,
  Divider,
  Tag,
  Space,
  Alert,
} from "antd";
import {
  InboxOutlined,
  ShopOutlined,
  SolutionOutlined,
  BankOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";
import { getProvinces, getDistricts, getWards } from "../../../services/api/ghnApi";

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

// --- STYLES (CSS-in-JS) ---
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "40px 20px",
  },
  leftPanel: {
    background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
    color: "#fff",
    padding: "60px 40px",
    borderRadius: "16px 0 0 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    minHeight: "600px",
  },
  rightPanel: {
    background: "#fff",
    padding: "40px",
    borderRadius: "0 16px 16px 0",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  typeCard: {
    cursor: "pointer",
    border: "2px solid #f0f0f0",
    transition: "all 0.3s",
    borderRadius: "12px",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  iconLarge: {
    fontSize: "42px",
    marginBottom: "16px",
    color: "#1890ff",
  },
  listCondition: {
    fontSize: "13px",
    color: "#666",
    listStyleType: "none",
    padding: 0,
    marginTop: 10,
  },
};

export default function SellerRegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sellerStatus, setSellerStatus] = useState(null);

  // Files State
  const [businessLicense, setBusinessLicense] = useState(null);
  const [cccdFront, setCccdFront] = useState(null);
  const [cccdBack, setCccdBack] = useState(null);
  const [shopImage, setShopImage] = useState(null);

  // User Type State
  const [userType, setUserType] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedWardCode, setSelectedWardCode] = useState(null);

  const token = localStorage.getItem("token");
  const headersAuth = token ? { Authorization: `Bearer ${token}` } : {};
  const { setRole } = useAuth();

  const isValidProvinceName = (name) => {
    if (!name || typeof name !== 'string') return false;
    // Regex này sẽ loại bỏ: "Quận 1", "Phường 12", "TP. HCM", "Bà Rịa - Vũng Tàu"...
    // Chỉ giữ lại: "Hà Nội", "Ba Đình", "Hoàn Kiếm"...
    if (/[0-9!@#$%^&*()_+=\[\]{};:'"\\|,.<>?/`~]/.test(name)) return false;
    if (/test/i.test(name)) return false;
    return true;
  };

  useEffect(() => {
    fetchSeller();
    fetchUser();
    fetchProvinces();
  }, []);

  // Fetch GHN Provinces

  const fetchProvinces = async () => {
    try {
      const data = await getProvinces();
      // Lọc dữ liệu bằng hàm isValidProvinceName
      const cleanData = data.filter(p => isValidProvinceName(p.ProvinceName));
      setProvinces(cleanData);
    } catch (err) {
      console.error("Lỗi tải tỉnh/thành:", err);
    }
  };

  // Fetch Districts when province changes
  useEffect(() => {
    if (selectedProvinceId) {
      fetchDistrictsData();
    }
  }, [selectedProvinceId]);

 const fetchDistrictsData = async () => {
    try {
      const data = await getDistricts(selectedProvinceId);
      // Lọc dữ liệu
      const cleanData = data.filter(d => isValidProvinceName(d.DistrictName));
      
      setDistricts(cleanData);
      setWards([]);
      setSelectedDistrictId(null);
      setSelectedWardCode(null);
    } catch (err) {
      console.error("Lỗi tải quận/huyện:", err);
    }
  };
  // Fetch Wards when district changes
  useEffect(() => {
    if (selectedDistrictId) {
      fetchWardsData();
    }
  }, [selectedDistrictId]);

  const fetchWardsData = async () => {
    try {
      const data = await getWards(selectedDistrictId);
      // Lọc dữ liệu
      const cleanData = data.filter(w => isValidProvinceName(w.WardName));
      
      setWards(cleanData);
      setSelectedWardCode(null);
    } catch (err) {
      console.error("Lỗi tải phường/xã:", err);
    }
  };


  // --- API CALLS ---
  const fetchSeller = async () => {
    if (!token) return setLoading(false);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/sellers/me/`, {
        headers: headersAuth,
      });
      if (!res.ok) throw new Error("Seller not found");
      const data = await res.json();
      setSellerStatus(data.status?.toLowerCase() || null);
      if (data.business_type) setUserType(data.business_type);
      form.setFieldsValue(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/me/`, {
        headers: headersAuth,
      });
      const data = await res.json();
      form.setFieldsValue({
        email: data.email,
        phone: data.phone,
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!sellerStatus) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerStatus]);

  const checkStoreName = async (name) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/sellers/check-store-name/?name=${name}`
    );
    return (await res.json()).exists;
  };

  // --- HANDLERS ---
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // Validate GHN address fields
      if (!selectedDistrictId || !selectedWardCode) {
        message.error("Vui lòng chọn quận/huyện và phường/xã!");
        setSubmitting(false);
        return;
      }

      const exist = await checkStoreName(values.store_name);
      if (exist) {
        message.error("Tên cửa hàng đã tồn tại!");
        setSubmitting(false);
        return;
      }
      const formData = new FormData();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        formData.append("user", payload.user_id || payload.id);
      }
      formData.append("business_type", userType);

      Object.entries(values).forEach(([key, val]) => {
        if (
          !["business_license", "cccd_front", "cccd_back", "image"].includes(
            key
          )
        ) {
          formData.append(key, val);
        }
      });

      // Append GHN address fields
      formData.append("district_id", selectedDistrictId);
      formData.append("ward_code", selectedWardCode);

      // append files
      const appendFile = (key, file) => {
        if (file) formData.append(key, file.originFileObj || file);
      };
      appendFile("business_license", businessLicense);
      appendFile("cccd_front", cccdFront);
      appendFile("cccd_back", cccdBack);
      appendFile("image", shopImage);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/sellers/register/`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        message.error(data.message || "Đăng ký thất bại");
        return;
      }
      message.success("Gửi yêu cầu thành công!");
      setSellerStatus("pending");
    } catch (err) {
      message.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenShop = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/sellers/activate/`,
        {
          method: "POST",
          headers: headersAuth,
        }
      );
      if (!res.ok) throw new Error("Lỗi kích hoạt");
      message.success("Cửa hàng đã mở!");
      setSellerStatus("active");
      setRole("seller");
    } catch (e) {
      message.error(e.message);
    }
  };

  // --- SUB COMPONENTS ---

  // 1. Upload Box (Kéo thả)
  const UploadBlock = ({ label, onChange, fileState }) => (
    <Form.Item
      label={label}
      required
      rules={[{ required: true, message: "Bắt buộc" }]}
    >
      <Dragger
        beforeUpload={() => false}
        onChange={(info) => onChange(info.file)}
        maxCount={1}
        listType="picture"
        fileList={fileState ? [fileState] : []}
        style={{
          background: "#fafafa",
          borderColor: "#d9d9d9",
          padding: "10px",
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: "#1890ff" }} />
        </p>
        <p className="ant-upload-text" style={{ fontSize: 14 }}>
          Kéo thả hoặc chọn ảnh
        </p>
      </Dragger>
    </Form.Item>
  );

  // 2. Thẻ chọn loại hình (Card Selection)
  const TypeSelectionCard = ({
    type,
    icon,
    title,
    desc,
    conditions,
    active,
  }) => (
    <div
      style={{
        ...styles.typeCard,
        borderColor: active ? "#1890ff" : "#f0f0f0",
        backgroundColor: active ? "#e6f7ff" : "#fff",
      }}
      onClick={() => setUserType(type)}
      className="hover-card" // Bạn có thể thêm class css hover nếu muốn
    >
      <div style={{ padding: "24px", textAlign: "center" }}>
        {icon}
        <Title level={4} style={{ marginTop: 10, marginBottom: 5 }}>
          {title}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {desc}
        </Text>

        <Divider style={{ margin: "12px 0" }} />

        <div
          style={{
            textAlign: "left",
            background: active ? "rgba(24,144,255,0.1)" : "#f9f9f9",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text
            strong
            style={{ fontSize: 12, display: "block", marginBottom: 5 }}
          >
            <InfoCircleOutlined /> Yêu cầu giấy tờ:
          </Text>
          <ul style={styles.listCondition}>
            {conditions.map((c, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                • {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {active && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "#1890ff",
            color: "#fff",
            padding: "2px 10px",
            borderRadius: "0 0 0 10px",
            fontSize: 12,
          }}
        >
          Đang chọn
        </div>
      )}
    </div>
  );

  // --- MAIN RENDER ---
  if (loading)
    return (
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: 100 }}
      >
        <Spin size="large" />
      </div>
    );

  return (
    <div style={styles.container}>
      <Row justify="center">
        <Col xs={24} xl={20}>
          <Row
            style={{
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* --- CỘT TRÁI: INTRO --- */}
            <Col xs={0} lg={8} style={styles.leftPanel}>
              <RocketOutlined style={{ fontSize: 60, marginBottom: 20 }} />
              <Title level={2} style={{ color: "#fff", margin: 0 }}>
                Đăng Ký Bán Hàng
              </Title>
              <Paragraph
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 16,
                  marginTop: 10,
                }}
              >
                Tiếp cận hàng triệu khách hàng tiềm năng. Quản lý cửa hàng dễ
                dàng, doanh thu vượt trội.
              </Paragraph>
              <Space
                direction="vertical"
                size="large"
                style={{ marginTop: 40 }}
              >
                <Space>
                  <CheckCircleOutlined />{" "}
                  <Text style={{ color: "#fff" }}>Miễn phí mở gian hàng</Text>
                </Space>
                <Space>
                  <CheckCircleOutlined />{" "}
                  <Text style={{ color: "#fff" }}>
                    Hỗ trợ vận chuyển 63 tỉnh thành
                  </Text>
                </Space>
                <Space>
                  <CheckCircleOutlined />{" "}
                  <Text style={{ color: "#fff" }}>
                    Thanh toán an toàn, minh bạch
                  </Text>
                </Space>
              </Space>
            </Col>

            {/* --- CỘT PHẢI: FORM & CONTENT --- */}
            <Col xs={24} lg={16} style={styles.rightPanel}>
              {/* THANH TIẾN TRÌNH */}
              <Steps
                current={
                  sellerStatus === "pending"
                    ? 1
                    : sellerStatus === "approved"
                      ? 2
                      : sellerStatus === "active"
                        ? 3
                        : 0
                }
                size="small"
                style={{ marginBottom: 40 }}
                items={[
                  { title: "Thông tin", icon: <SolutionOutlined /> },
                  { title: "Xét duyệt", icon: <ClockCircleOutlined /> },
                  { title: "Kết quả", icon: <CheckCircleOutlined /> },
                  { title: "Hoạt động", icon: <ShopOutlined /> },
                ]}
              />

              {/* 1. MÀN HÌNH CHỌN LOẠI HÌNH (Nếu chưa đăng ký & chưa chọn) */}
              {!sellerStatus && !userType && (
                <div style={{ animation: "fadeIn 0.5s" }}>
                  <Title
                    level={3}
                    style={{ textAlign: "center", marginBottom: 30 }}
                  >
                    Chọn hình thức kinh doanh
                  </Title>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <TypeSelectionCard
                        type="personal"
                        icon={<UserOutlined style={styles.iconLarge} />}
                        title="Cá nhân"
                        desc="Dành cho sinh viên, cá nhân bán lẻ online."
                        conditions={[
                          "CCCD 2 mặt (Bắt buộc)",
                          "Mã số thuế cá nhân (Nếu có)",
                        ]}
                        active={false}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <TypeSelectionCard
                        type="household"
                        icon={<ShopOutlined style={styles.iconLarge} />}
                        title="Hộ Kinh Doanh"
                        desc="Cửa hàng nhỏ, hộ gia đình kinh doanh tại nhà."
                        conditions={[
                          "Giấy ĐKKD Hộ cá thể",
                          "Mã số thuế",
                          "CCCD chủ hộ",
                        ]}
                        active={false}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <TypeSelectionCard
                        type="business"
                        icon={<BankOutlined style={styles.iconLarge} />}
                        title="Doanh nghiệp"
                        desc="Công ty TNHH, Cổ phần, Nhà phân phối chính hãng."
                        conditions={[
                          "Giấy ĐKKD Doanh nghiệp",
                          "Mã số thuế công ty",
                          "Đại diện pháp luật",
                        ]}
                        active={false}
                      />
                    </Col>
                  </Row>

                  <div style={{ textAlign: "center", marginTop: 40 }}>
                    <Button type="text" onClick={() => navigate("/")}>
                      Quay lại trang chủ
                    </Button>
                  </div>
                </div>
              )}

              {/* 2. FORM ĐIỀN THÔNG TIN (Nếu chưa đăng ký & ĐÃ CHỌN loại) */}
              {!sellerStatus && userType && (
                <div style={{ animation: "fadeInRight 0.5s" }}>
                  <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setUserType(null)}
                    style={{ marginBottom: 10, paddingLeft: 0 }}
                  >
                    Chọn lại hình thức
                  </Button>

                  <Title level={3}>
                    Đăng ký:{" "}
                    {userType === "personal"
                      ? "Cá nhân"
                      : userType === "household"
                        ? "Hộ kinh doanh"
                        : "Doanh nghiệp"}
                  </Title>

                  {/* Banner nhắc nhở giấy tờ cần thiết */}
                  <Alert
                    message="Chuẩn bị giấy tờ"
                    description={
                      userType === "personal"
                        ? "Vui lòng chuẩn bị ảnh chụp rõ nét 2 mặt CCCD/CMND của bạn."
                        : userType === "household"
                          ? "Vui lòng chuẩn bị Giấy ĐKKD hộ cá thể và CCCD chủ hộ."
                          : "Vui lòng chuẩn bị Giấy phép kinh doanh của doanh nghiệp."
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                  />

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                  >
                    <Divider orientation="left">1. Thông tin gian hàng</Divider>
                    <Row gutter={24}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="store_name"
                          label="Tên cửa hàng"
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="Ví dụ: Shop Thời Trang A" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="phone"
                          label="Số điện thoại"
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="0912 xxx xxx" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="email" label="Email liên hệ">
                          <Input placeholder="contact@shop.com" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="address" label="Địa chỉ lấy hàng">
                          <Input placeholder="Số nhà, đường, phường/xã..." />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="bio" label="Giới thiệu">
                          <Input.TextArea
                            rows={2}
                            placeholder="Mô tả ngắn gọn về cửa hàng..."
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">
                      2. Giấy tờ pháp lý & Hình ảnh
                    </Divider>

                    <Row gutter={24}>
                      {/* LOGIC HIỂN THỊ FIELD THEO TYPE */}
                      {["business", "household"].includes(userType) && (
                        <>
                          <Col span={24}>
                            <Form.Item
                              name="tax_code"
                              label="Mã số thuế"
                              rules={[{ required: true }]}
                            >
                              <Input placeholder="Nhập mã số thuế..." />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <UploadBlock
                              label={
                                userType === "business"
                                  ? "Giấy phép kinh doanh (Ảnh)"
                                  : "Giấy ĐKKD Hộ cá thể (Ảnh)"
                              }
                              onChange={setBusinessLicense}
                              fileState={businessLicense}
                            />
                          </Col>
                        </>
                      )}

                      {userType === "personal" && (
                        <>
                          <Col span={24}>
                            <Form.Item
                              name="tax_code"
                              label="Mã số thuế cá nhân (Không bắt buộc)"
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <UploadBlock
                              label="CCCD Mặt trước"
                              onChange={setCccdFront}
                              fileState={cccdFront}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <UploadBlock
                              label="CCCD Mặt sau"
                              onChange={setCccdBack}
                              fileState={cccdBack}
                            />
                          </Col>
                        </>
                      )}
                      <Col span={24}>
                        <UploadBlock
                          label="Ảnh đại diện cửa hàng (Logo)"
                          onChange={setShopImage}
                          fileState={shopImage}
                        />
                      </Col>
                    </Row>

                    <Divider />
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      block
                      size="large"
                      style={{ height: 48, fontSize: 16 }}
                    >
                      Hoàn tất đăng ký
                    </Button>
                  </Form>
                </div>
              )}

              {/* 3. TRẠNG THÁI STATUS (Pending / Approved) */}
              {sellerStatus && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  {sellerStatus === "pending" && (
                    <Result
                      status="info"
                      title="Hồ sơ đang được xét duyệt"
                      subTitle="Chúng tôi đã nhận được thông tin. Vui lòng quay lại sau 24-48h."
                      extra={[
                        <Button key="home" onClick={() => navigate("/")}>
                          Về trang chủ
                        </Button>,
                      ]}
                    />
                  )}

                  {sellerStatus === "approved" && (
                    <Result
                      status="success"
                      title="Hồ sơ đã được duyệt!"
                      subTitle="Bạn đã sẵn sàng để bắt đầu bán hàng."
                      extra={[
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleOpenShop}
                          key="activate"
                        >
                          Kích hoạt ngay
                        </Button>,
                      ]}
                    />
                  )}

                  {sellerStatus === "active" && (
                    <Result
                      status="success"
                      title="Cửa hàng đang hoạt động"
                      extra={[
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => navigate("/seller-center/dashboard")}
                          key="dash"
                        >
                          Vào trang quản lý
                        </Button>,
                      ]}
                    />
                  )}
                </div>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}
