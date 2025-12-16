import React, { useEffect, useState } from "react";
import {
  Drawer,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  Divider,
  Button,
  Spin,
  message,
  Empty,
} from "antd";
import {
  UserOutlined,
  SafetyCertificateFilled,
  ShopOutlined,
  HistoryOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

// Cấu hình API (Nên import từ file config chung của dự án nếu có)
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

const ShopDetailDrawer = ({ visible, onClose, shopData }) => {
  const [loading, setLoading] = useState(false);
  const [detailInfo, setDetailInfo] = useState(null);

  // Reset dữ liệu khi đóng hoặc đổi shop
  useEffect(() => {
    if (visible && shopData?.id) {
      fetchShopDetail(shopData.id);
    } else {
      setDetailInfo(null);
    }
  }, [visible, shopData]);

  // --- HÀM GỌI API LẤY CHI TIẾT SHOP ---
  const fetchShopDetail = async (sellerId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // GỌI API: Bạn cần đảm bảo Backend có endpoint này (ví dụ: /sellers/123/ hoặc /users/123/)
      // Nếu API của bạn khác, hãy sửa đường dẫn bên dưới
      const res = await api.get(`/sellers/${sellerId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDetailInfo(res.data);
    } catch (error) {
      console.error("Lỗi lấy chi tiết shop:", error);
      // Nếu không có API chi tiết, ta sẽ dùng tạm dữ liệu từ props truyền vào (dù có thể thiếu)
      setDetailInfo(shopData);
    } finally {
      setLoading(false);
    }
  };

  // --- HỢP NHẤT DỮ LIỆU (Merge Props + API) ---
  // Ưu tiên dữ liệu từ API chi tiết, nếu không có thì dùng dữ liệu từ danh sách
  const finalData = {
    ...shopData, // Dữ liệu cơ bản (id, store_name, avatar)
    ...detailInfo, // Dữ liệu chi tiết (email, phone, address, owner_name)
  };

  // Hàm helper để hiển thị giá trị an toàn
  const renderValue = (val) =>
    val ? (
      <Text strong>{val}</Text>
    ) : (
      <Text type="secondary" italic>
        Chưa cập nhật
      </Text>
    );

  // Mapping các trường dữ liệu (Vì backend có thể trả về snake_case hoặc camelCase)
  const displayInfo = {
    name: finalData.store_name || finalData.shopName || "Cửa hàng không tên",
    avatar: finalData.avatar,
    owner:
      finalData.owner_name || // TH1: Nằm ngay ngoài
      finalData.full_name || // TH2: Tên biến khác
      finalData.user?.full_name || // TH3: Nằm trong object User (Rất phổ biến)
      finalData.user?.username || // TH4: Nếu không có tên thật, lấy username
      finalData.owner?.full_name || // TH5: Backend đặt tên object là owner
      "Chưa cập nhật", // check nhiều trường hợp
    phone: finalData.phone || finalData.phone_number || finalData.hotline,
    email: finalData.email,
    address: finalData.address || finalData.store_address,
    joinDate: finalData.created_at,
    rating: Number(finalData.rating ?? finalData.average_rating ?? 0),
    violation: finalData.violation_count || 0,
  };

  const daysJoined = displayInfo.joinDate
    ? Math.floor(
        (new Date() - new Date(displayInfo.joinDate)) / (1000 * 60 * 60 * 24)
      )
    : 0;

  if (!shopData) return null;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShopOutlined /> Hồ sơ Người Bán
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      extra={
        <Button
          type="primary"
          danger
          onClick={() => {
            message.success(`Đã gửi yêu cầu khóa shop ID: ${shopData.id}`);
            onClose();
          }}
        >
          Khóa Shop này
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin tip="Đang tải thông tin chi tiết..." size="large" />
        </div>
      ) : (
        <>
          {/* 1. Header: Avatar & Tên Shop */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Avatar
              size={80}
              src={displayInfo.avatar}
              icon={<UserOutlined />}
              style={{ border: "2px solid #1890ff", marginBottom: "10px" }}
            />
            <Title level={3} style={{ margin: 0 }}>
              {displayInfo.name}
              <SafetyCertificateFilled
                style={{
                  color: "#52c41a",
                  fontSize: "20px",
                  marginLeft: "8px",
                }}
                title="Đã xác minh KYC"
              />
            </Title>
            <Text type="secondary">
              ID: {shopData.id} • Tham gia: {daysJoined} ngày trước
            </Text>
          </div>

          {/* 2. Thống kê nhanh */}
          <div
            style={{
              background: "#f5f5f5",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <Row gutter={16} style={{ textAlign: "center" }}>
              <Col span={8}>
                <Statistic
                  title="Đánh giá"
                  value={displayInfo.rating} // Luôn hiển thị giá trị số
                  precision={1} // Quy định hiện 1 số thập phân (VD: 0.0, 4.5)
                  suffix="/ 5.0" // Luôn hiển thị đuôi này
                  valueStyle={{
                    // Logic màu sắc: > 0 thì màu Vàng, bằng 0 thì màu Xám (để đỡ nhầm là điểm cao)
                    color:
                      displayInfo.rating > 0 ? "#faad14" : "rgba(0,0,0,0.45)",
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Sản phẩm"
                  value={shopData.products?.length || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Vi phạm"
                  value={displayInfo.violation}
                  valueStyle={{ color: "#cf1322" }}
                  prefix={<HistoryOutlined />}
                />
              </Col>
            </Row>
          </div>

          {/* 3. Thông tin chi tiết (Phần bạn đang bị thiếu) */}
          <Descriptions
            title="Thông tin liên hệ & Pháp lý"
            bordered
            column={1}
            size="middle"
            labelStyle={{ width: "140px", fontWeight: "bold" }}
          >
            <Descriptions.Item
              label={
                <>
                  <UserOutlined /> Chủ sở hữu
                </>
              }
            >
              {renderValue(displayInfo.owner)}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <>
                  <PhoneOutlined /> Số điện thoại
                </>
              }
            >
              {renderValue(displayInfo.phone)}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <>
                  <MailOutlined /> Email
                </>
              }
            >
              {renderValue(displayInfo.email)}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <>
                  <EnvironmentOutlined /> Địa chỉ
                </>
              }
            >
              {renderValue(displayInfo.address)}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* 4. Cảnh báo rủi ro */}
          <Title level={5}>📋 Phân tích rủi ro</Title>
          {daysJoined <= 7 ? (
            <div
              style={{
                background: "#fffbe6",
                padding: "12px",
                border: "1px solid #ffe58f",
                borderRadius: "4px",
                display: "flex",
                gap: "10px",
              }}
            >
              <HistoryOutlined
                style={{ color: "#faad14", fontSize: "20px", marginTop: "4px" }}
              />
              <div>
                <Text strong type="warning">
                  Shop mới tạo (Dưới 7 ngày)
                </Text>
                <br />
                <Text type="secondary">
                  Vui lòng kiểm tra kỹ thông tin liên hệ và đối chiếu số điện
                  thoại trước khi duyệt các sản phẩm giá trị cao.
                </Text>
              </div>
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có cảnh báo rủi ro nào."
              style={{ margin: "10px 0" }}
            />
          )}
        </>
      )}
    </Drawer>
  );
};

export default ShopDetailDrawer;
