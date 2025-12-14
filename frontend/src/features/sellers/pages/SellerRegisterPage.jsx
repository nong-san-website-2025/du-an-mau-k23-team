import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <--- 1. Import useNavigate
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Spin,
  Card,
  Steps,
  Modal,
  Radio,
  Select,
  Result, // <--- 2. Import Result để hiển thị thông báo
} from "antd";
import {
  UploadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SmileOutlined, // Icon cho Result
} from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";
import { getProvinces, getDistricts, getWards } from "../../../services/api/ghnApi";

const { Step } = Steps;

export default function SellerRegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate(); // <--- 3. Khởi tạo navigate
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sellerStatus, setSellerStatus] = useState(null);

  const [businessLicense, setBusinessLicense] = useState(null);
  const [cccdFront, setCccdFront] = useState(null);
  const [cccdBack, setCccdBack] = useState(null);
  const [shopImage, setShopImage] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const [showTypeModal, setShowTypeModal] = useState(true);
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

  // ===== FETCH SELLER =====
  const fetchSeller = async () => {
    if (!token) return setLoading(false);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/sellers/me/`, {
        headers: headersAuth,
      });
      if (!res.ok) throw new Error("Không tìm thấy seller");
      const data = await res.json();

      setSellerStatus(data.status?.toLowerCase() || null);

      form.setFieldsValue({
        store_name: data.store_name,
        bio: data.bio,
        address: data.address,
        phone: data.phone,
        email: data.email,
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ===== FETCH USER INFO =====
  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/me/`, {
        headers: headersAuth,
      });
      const data = await res.json();
      setCurrentUser(data);

      form.setFieldsValue({
        email: data.email,
        phone: data.phone,
      });
    } catch (err) {
      console.log(err);
    }
  };

  // ===== CHECK STORE NAME =====
  const checkStoreName = async (name) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/sellers/check-store-name/?name=${name}`
    );
    return (await res.json()).exists;
  };

  // ===== SUBMIT =====
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

      // user id
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        formData.append("user", payload.user_id || payload.id);
      }

      formData.append("business_type", userType);

      // append text fields
      Object.entries(values).forEach(([key, val]) => {
        if (
          key !== "business_license" &&
          key !== "cccd_front" &&
          key !== "cccd_back" &&
          key !== "image"
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

      const res = await fetch(`${process.env.REACT_APP_API_URL}/sellers/register/`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.log(data);
        message.error(data.message || "Đăng ký thất bại");
        return;
      }

      message.success("Gửi yêu cầu đăng ký thành công!");
      setSellerStatus("pending");
    } catch (err) {
      message.error("Lỗi submit");
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== OPEN SHOP (ACTIVATE) =====
  const handleOpenShop = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/sellers/activate/`, {
        method: "POST",
        headers: headersAuth,
      });
      if (!res.ok) throw new Error("Mở cửa hàng thất bại");

      message.success("Cửa hàng đã mở!");
      setSellerStatus("active");
      setRole("seller");
      
      // Sau khi kích hoạt thành công, có thể redirect luôn hoặc để user tự bấm
      // navigate("/seller/dashboard"); 
    } catch (e) {
      message.error(e.message);
    }
  };

  if (loading) return <Spin tip="Đang tải..." />;

  return (
    <div style={{ maxWidth: 650, margin: "20px auto" }}>
      <Card>
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
        >
          <Step title="Chưa đăng ký" icon={<ShopOutlined />} />
          <Step title="Chờ duyệt" icon={<ClockCircleOutlined />} />
          <Step title="Duyệt" icon={<CheckCircleOutlined />} />
          <Step title="Hoạt động" icon={<CheckCircleOutlined />} />
        </Steps>

        {/* --- TRƯỜNG HỢP 1: PENDING (CHỜ DUYỆT) --- */}
        {sellerStatus === "pending" && (
          <Result
            icon={<ClockCircleOutlined />}
            title="Đăng ký của bạn đang chờ phê duyệt"
            subTitle="Vui lòng quay lại sau khi quản trị viên xác nhận thông tin của bạn."
          />
        )}

        {/* --- TRƯỜNG HỢP 2: APPROVED (ĐÃ DUYỆT - CẦN KÍCH HOẠT) --- */}
        {sellerStatus === "approved" && (
          <Result
            icon={<SmileOutlined />}
            title="Chúc mừng! Hồ sơ đã được duyệt"
            subTitle="Bạn đã sẵn sàng để bắt đầu kinh doanh chưa?"
            extra={[
              <Button type="primary" key="console" onClick={handleOpenShop}>
                Kích hoạt cửa hàng ngay
              </Button>,
            ]}
          />
        )}

        {/* --- TRƯỜNG HỢP 3: ACTIVE (ĐANG HOẠT ĐỘNG - VÀO DASHBOARD) --- */}
        {sellerStatus === "active" && (
          <Result
            status="success"
            title="Cửa hàng đang hoạt động!"
            subTitle="Truy cập trang quản lý để đăng bán sản phẩm."
            extra={[
              <Button 
                type="primary" 
                key="dashboard" 
                onClick={() => navigate("/seller-center/dashboard")} // Thay đường dẫn dashboard thực tế của bạn vào đây
              >
                Vào trang quản lý người bán
              </Button>,
            ]}
          />
        )}

        {/* --- TRƯỜNG HỢP 0: CHƯA CÓ STATUS -> HIỆN MODAL CHỌN LOẠI --- */}
        {!sellerStatus && (
          <Modal
            open={showTypeModal}
            closable={false}
            footer={null}
            title="Bạn là ai?"
          >
            <Radio.Group
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Radio value="business">Doanh nghiệp</Radio>
              <Radio value="household">Hộ kinh doanh</Radio>
              <Radio value="personal">Cá nhân</Radio>
            </Radio.Group>

            <Button
              type="primary"
              block
              disabled={!userType}
              style={{ marginTop: 20 }}
              onClick={() => setShowTypeModal(false)}
            >
              Tiếp tục
            </Button>
          </Modal>
        )}

        {/* --- FORM ĐĂNG KÝ (CHỈ HIỆN KHI CHƯA CÓ STATUS VÀ ĐÃ TẮT MODAL) --- */}
        {!sellerStatus && !showTypeModal && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: 30 }}
          >
            {/* ... (Giữ nguyên các trường Form của bạn như cũ) ... */}
            <Form.Item
              name="store_name"
              label="Tên cửa hàng"
              rules={[{ required: true, message: "Nhập tên cửa hàng" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="email" label="Email">
              <Input />
            </Form.Item>

            <Form.Item name="phone" label="SĐT">
              <Input />
            </Form.Item>

            <Form.Item name="address" label="Địa chỉ">
              <Input />
            </Form.Item>

            <Form.Item
              label="Tỉnh/Thành phố"
              rules={[{ required: true, message: "Chọn tỉnh/thành phố" }]}
            >
              <Select
                placeholder="Chọn tỉnh/thành phố"
                onChange={(value) => setSelectedProvinceId(value)}
                options={provinces.map((p) => ({
                  label: p.ProvinceName,
                  value: p.ProvinceID,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Quận/Huyện"
              rules={[{ required: true, message: "Chọn quận/huyện" }]}
            >
              <Select
                placeholder="Chọn quận/huyện"
                onChange={(value) => setSelectedDistrictId(value)}
                value={selectedDistrictId}
                disabled={!selectedProvinceId}
                options={districts.map((d) => ({
                  label: d.DistrictName,
                  value: d.DistrictID,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Phường/Xã"
              rules={[{ required: true, message: "Chọn phường/xã" }]}
            >
              <Select
                placeholder="Chọn phường/xã"
                onChange={(value) => setSelectedWardCode(value)}
                value={selectedWardCode}
                disabled={!selectedDistrictId}
                options={wards.map((w) => ({
                  label: w.WardName,
                  value: w.WardCode,
                }))}
              />
            </Form.Item>

            {/* DOANH NGHIỆP / HỘ */}
            {["business", "household"].includes(userType) && (
              <>
                <Form.Item
                  name="tax_code"
                  label="Mã số thuế"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="business_license"
                  label="Giấy phép kinh doanh"
                  rules={[{ required: true }]}
                >
                  <Upload
                    beforeUpload={() => false}
                    onChange={(info) => setBusinessLicense(info.file)}
                  >
                    <Button icon={<UploadOutlined />}>Tải ảnh</Button>
                  </Upload>
                </Form.Item>
              </>
            )}

            {/* CÁ NHÂN */}
            {userType === "personal" && (
              <>
                <Form.Item
                  name="tax_code"
                  label="Mã số thuế (không bắt buộc)"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="image"
                  label="Ảnh cửa hàng"
                  rules={[{ required: true, message: "Vui lòng tải ảnh cửa hàng" }]}
                >
                  <Upload
                    beforeUpload={() => false}
                    onChange={(info) => setShopImage(info.file)}
                    listType="picture"
                  >
                    <Button icon={<UploadOutlined />}>Tải ảnh cửa hàng</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="cccd_front"
                  label="CCCD mặt trước"
                  rules={[{ required: true }]}
                >
                  <Upload
                    beforeUpload={() => false}
                    onChange={(info) => setCccdFront(info.file)}
                  >
                    <Button icon={<UploadOutlined />}>Tải ảnh</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="cccd_back"
                  label="CCCD mặt sau"
                  rules={[{ required: true }]}
                >
                  <Upload
                    beforeUpload={() => false}
                    onChange={(info) => setCccdBack(info.file)}
                  >
                    <Button icon={<UploadOutlined />}>Tải ảnh</Button>
                  </Upload>
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={submitting}>
                Gửi yêu cầu đăng ký
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}