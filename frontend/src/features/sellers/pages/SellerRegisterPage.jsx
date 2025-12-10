import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Result,
  Spin,
  Card,
  Steps,
  Modal,
  Radio,
} from "antd";
import {
  UploadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";

const { Step } = Steps;

export default function SellerRegisterPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sellerStatus, setSellerStatus] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [showTypeModal, setShowTypeModal] = useState(true);
  const [userType, setUserType] = useState(null);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const { setRole } = useAuth();

  useEffect(() => {
    fetchSeller();
    fetchUser();
  }, []);

  const fetchSeller = async () => {
    if (!token) return setLoading(false);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/sellers/me/`,
        { headers }
      );
      if (!res.ok) throw new Error("Không tìm thấy seller của bạn");
      const data = await res.json();
      setSellerStatus(data.status?.toLowerCase() || null);

      if (data) {
        form.setFieldsValue({
          store_name: data.store_name,
          bio: data.bio,
          address: data.address,
          phone: data.phone,
          email: data.email,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/users/me/`,
        { headers }
      );
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

  const checkStoreName = async (name) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/sellers/check-store-name/?name=${name}`
    );
    const data = await res.json();
    return data.exists;
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      const isExist = await checkStoreName(values.store_name);
      if (isExist) {
        message.error("Tên cửa hàng đã tồn tại!");
        return;
      }

      const formData = new FormData();

      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        formData.append("user", payload.user_id || payload.id);
      }

      formData.append("user_type", userType);

      Object.entries(values).forEach(([key, value]) => {
        if (key === "image" && fileList.length > 0) {
          formData.append("image", fileList[0].originFileObj);
        } else if (value) {
          formData.append(key, value);
        }
      });

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/sellers/register/`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );

      if (!res.ok) throw new Error("Đăng ký thất bại");

      message.success("Gửi yêu cầu đăng ký thành công!");
      setSellerStatus("pending");
    } catch (e) {
      message.error(e.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenShop = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/sellers/activate/`,
        { method: "POST", headers }
      );
      if (!res.ok) throw new Error("Mở cửa hàng thất bại");

      message.success("Cửa hàng đã mở!");
      setSellerStatus("active");
      setRole("seller");
    } catch (e) {
      message.error(e.message);
    }
  };

  if (loading) return <Spin tip="Đang tải..." />;

  return (
    <div style={{ maxWidth: 650, margin: "20px auto" }}>
      <Card>
        {/* STEP */}
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

        {/* MODAL CHỌN LOẠI */}
        {!sellerStatus && (
          <Modal
            title="Bạn là ai?"
            open={showTypeModal}
            closable={false}
            footer={null}
          >
            <Radio.Group
              onChange={(e) => setUserType(e.target.value)}
              value={userType}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Radio value="business">Doanh nghiệp</Radio>
              <Radio value="household">Hộ kinh doanh</Radio>
              <Radio value="personal">Cá nhân</Radio>
            </Radio.Group>

            <Button
              type="primary"
              block
              style={{ marginTop: 20 }}
              disabled={!userType}
              onClick={() => setShowTypeModal(false)}
            >
              Tiếp tục
            </Button>
          </Modal>
        )}

        {/* FORM */}
        {!sellerStatus && !showTypeModal && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: 30 }}
          >
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

            {/* FIELD ĐỘNG */}
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
                  <Upload beforeUpload={() => false} listType="picture">
                    <Button icon={<UploadOutlined />}>Tải ảnh</Button>
                  </Upload>
                </Form.Item>
              </>
            )}

            {userType === "personal" && (
              <>
                <Form.Item name="tax_code" label="Mã số thuế (không bắt buộc)">
                  <Input />
                </Form.Item>

                <Form.Item
                  name="cccd_front"
                  label="CCCD mặt trước"
                  rules={[{ required: true }]}
                >
                  <Upload beforeUpload={() => false} listType="picture">
                    <Button icon={<UploadOutlined />}>Tải ảnh</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="cccd_back"
                  label="CCCD mặt sau"
                  rules={[{ required: true }]}
                >
                  <Upload beforeUpload={() => false} listType="picture">
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
