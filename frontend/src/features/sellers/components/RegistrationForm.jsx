import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Divider,
  message,
  Select,
  Alert,
  DatePicker,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  getProvinces,
  getDistricts,
  getWards,
} from "../../../services/api/ghnApi";
import UploadBlock from "./UploadBlock";

const { Option } = Select;

// Danh sách ngân hàng phổ biến (Có thể gọi API nếu cần)
const BANK_LIST = [
  { shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại thương Việt Nam" },
  { shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ thương Việt Nam" },
  { shortName: "MBBank", name: "Ngân hàng TMCP Quân đội" },
  { shortName: "ACB", name: "Ngân hàng TMCP Á Châu" },
  { shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  { shortName: "VietinBank", name: "Ngân hàng TMCP Công thương Việt Nam" },
  { shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam" },
  { shortName: "Agribank", name: "Ngân hàng Agribank" },
  { shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong" },
];

export default function RegistrationForm({
  userType,
  setUserType,
  setSellerStatus,
  token,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // --- GHN Location State ---
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedWardCode, setSelectedWardCode] = useState(null);

  // --- Files State ---
  const [businessLicense, setBusinessLicense] = useState(null);
  const [cccdFront, setCccdFront] = useState(null);
  const [cccdBack, setCccdBack] = useState(null);
  const [shopImage, setShopImage] = useState(null);

  // --- Fetch User Info ---
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
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
    fetchUser();
  }, [token, form]);

  // --- GHN API Logic ---
  const isValidProvinceName = (name) => {
    if (!name || typeof name !== "string") return false;
    if (/[0-9!@#$%^&*()_+=\[\]{};:'"\\|,.<>?/`~]/.test(name)) return false;
    return !/test/i.test(name);
  };

  useEffect(() => {
    const fetchProvincesData = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data.filter((p) => isValidProvinceName(p.ProvinceName)));
      } catch (err) {
        console.error("Lỗi tải tỉnh/thành:", err);
      }
    };
    fetchProvincesData();
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      const fetchDistrictsData = async () => {
        try {
          const data = await getDistricts(selectedProvinceId);
          setDistricts(data.filter((d) => isValidProvinceName(d.DistrictName)));
          setWards([]);
          setSelectedDistrictId(null);
          setSelectedWardCode(null);
          form.setFieldsValue({ district_id: null, ward_code: null });
        } catch (err) {
          console.error("Lỗi tải quận/huyện:", err);
        }
      };
      fetchDistrictsData();
    }
  }, [selectedProvinceId, form]);

  useEffect(() => {
    if (selectedDistrictId) {
      const fetchWardsData = async () => {
        try {
          const data = await getWards(selectedDistrictId);
          setWards(data.filter((w) => isValidProvinceName(w.WardName)));
          setSelectedWardCode(null);
          form.setFieldsValue({ ward_code: null });
        } catch (err) {
          console.error("Lỗi tải phường/xã:", err);
        }
      };
      fetchWardsData();
    }
  }, [selectedDistrictId, form]);

  // --- Handlers ---
  const checkStoreName = async (name) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/sellers/check-store-name/?name=${name}`
    );
    return (await res.json()).exists;
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (!selectedProvinceId || !selectedDistrictId || !selectedWardCode) {
        message.error("Vui lòng chọn đầy đủ địa chỉ (Tỉnh/Huyện/Xã)");
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

      // --- Append Fields ---
      Object.entries(values).forEach(([key, val]) => {
        // Lọc ra các field file và location để xử lý riêng
        if (
          ![
            "business_license",
            "cccd_front",
            "cccd_back",
            "image",
            "province_id",
            "district_id",
            "ward_code",
            "cid_issue_date", // Xử lý date riêng nếu cần format
          ].includes(key)
        ) {
          if (val !== undefined && val !== null) {
            formData.append(key, val);
          }
        }
      });

      // Append Date fields (nếu có)
      if (values.cid_issue_date) {
        formData.append("cid_issue_date", values.cid_issue_date.format("YYYY-MM-DD"));
      }

      // Append Location IDs
      formData.append("province_id", selectedProvinceId);
      formData.append("district_id", selectedDistrictId);
      formData.append("ward_code", selectedWardCode);

      // Append Files
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
      console.error(err);
      message.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ animation: "fadeInRight 0.5s" }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => setUserType(null)}
        style={{ marginBottom: 10, paddingLeft: 0 }}
      >
        Chọn lại hình thức
      </Button>

      <Alert
        message="Chuẩn bị giấy tờ"
        description={
          userType === "personal"
            ? "Chuẩn bị ảnh chụp 2 mặt CCCD và thông tin tài khoản ngân hàng chính chủ."
            : "Chuẩn bị Giấy phép kinh doanh, CCCD chủ hộ/đại diện và tài khoản ngân hàng."
        }
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
        {/* === PHẦN 1: THÔNG TIN CƠ BẢN === */}
        <Divider orientation="left">1. Thông tin gian hàng & Địa chỉ</Divider>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="store_name"
              label="Tên cửa hàng"
              rules={[{ required: true, message: "Nhập tên cửa hàng" }]}
            >
              <Input placeholder="Ví dụ: GreenFarm Official" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: "Nhập SĐT" }]}
            >
              <Input placeholder="0912 xxx xxx" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label="Email liên hệ"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input placeholder="contact@shop.com" />
            </Form.Item>
          </Col>

          {/* GHN Fields */}
          <Col xs={24} md={12}>
            <Form.Item label="Tỉnh / Thành phố" required>
              <Select
                showSearch
                placeholder="Chọn Tỉnh/Thành"
                optionFilterProp="children"
                onChange={setSelectedProvinceId}
                value={selectedProvinceId}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {provinces.map((p) => (
                  <Option key={p.ProvinceID} value={p.ProvinceID}>
                    {p.ProvinceName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Quận / Huyện" required>
              <Select
                showSearch
                placeholder="Chọn Quận/Huyện"
                optionFilterProp="children"
                onChange={setSelectedDistrictId}
                value={selectedDistrictId}
                disabled={!selectedProvinceId}
                loading={!districts.length && selectedProvinceId}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {districts.map((d) => (
                  <Option key={d.DistrictID} value={d.DistrictID}>
                    {d.DistrictName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Phường / Xã" required>
              <Select
                showSearch
                placeholder="Chọn Phường/Xã"
                optionFilterProp="children"
                onChange={setSelectedWardCode}
                value={selectedWardCode}
                disabled={!selectedDistrictId}
                loading={!wards.length && selectedDistrictId}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {wards.map((w) => (
                  <Option key={w.WardCode} value={w.WardCode}>
                    {w.WardName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="address"
              label="Địa chỉ cụ thể"
              rules={[{ required: true, message: "Nhập số nhà, tên đường" }]}
            >
              <Input placeholder="Ví dụ: 123 Đường Nguyễn Văn Linh" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="bio"
              label="Giới thiệu"
              rules={[{ max: 500, message: "Tối đa 500 ký tự" }]}
            >
              <Input.TextArea
                rows={2}
                placeholder="Mô tả ngắn gọn..."
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        {/* === PHẦN 2: THÔNG TIN PHÁP LÝ === */}
        <Divider orientation="left">2. Giấy tờ pháp lý & Hình ảnh</Divider>
        <Row gutter={24}>
          {/* CÁC TRƯỜNG CHO DOANH NGHIỆP/HỘ KD */}
          {["business", "household"].includes(userType) && (
            <>
              <Col xs={24} md={12}>
                <Form.Item
                  name="tax_code"
                  label="Mã số thuế"
                  rules={[{ required: true, message: "Nhập mã số thuế" }]}
                >
                  <Input placeholder="Mã số thuế..." />
                </Form.Item>
              </Col>
              {/* Thêm trường CCCD cho chủ hộ nếu là Hộ KD */}
              {userType === "household" && (
                <Col xs={24} md={12}>
                  <Form.Item
                    name="cid_number"
                    label="Số CCCD/CMND Chủ hộ"
                    rules={[{ required: true, message: "Nhập số CCCD" }]}
                  >
                    <Input placeholder="Số căn cước công dân" />
                  </Form.Item>
                </Col>
              )}
              <Col span={24}>
                <UploadBlock
                  label={
                    userType === "business"
                      ? "Giấy phép KD (Ảnh)"
                      : "Giấy ĐKKD Hộ cá thể (Ảnh)"
                  }
                  onChange={setBusinessLicense}
                  fileState={businessLicense}
                />
              </Col>
            </>
          )}

          {/* CÁC TRƯỜNG CHO CÁ NHÂN */}
          {userType === "personal" && (
            <>
              <Col xs={24} md={12}>
                <Form.Item
                  name="cid_number"
                  label="Số CCCD/CMND"
                  rules={[{ required: true, message: "Vui lòng nhập số CCCD" }]}
                >
                  <Input placeholder="Nhập số thẻ..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="tax_code" label="Mã số thuế cá nhân (Nếu có)">
                  <Input placeholder="Không bắt buộc" />
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

        {/* === PHẦN 3: THÔNG TIN THANH TOÁN (MỚI) === */}
        <Divider orientation="left">3. Thông tin thanh toán (Ngân hàng)</Divider>
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Form.Item
              name="bank_name"
              label="Tên ngân hàng"
              rules={[{ required: true, message: "Chọn ngân hàng" }]}
            >
              <Select
                showSearch
                placeholder="Chọn ngân hàng"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {BANK_LIST.map((bank) => (
                  <Option key={bank.shortName} value={bank.shortName}>
                    {bank.shortName} - {bank.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="bank_account_number"
              label="Số tài khoản"
              rules={[{ required: true, message: "Nhập số tài khoản" }]}
            >
              <Input placeholder="Ví dụ: 1903..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="bank_account_name"
              label="Tên chủ tài khoản"
              rules={[{ required: true, message: "Nhập tên in hoa không dấu" }]}
              help="Nhập tên in hoa không dấu (Ví dụ: NGUYEN VAN A)"
            >
              <Input style={{ textTransform: "uppercase" }} />
            </Form.Item>
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
  );
}