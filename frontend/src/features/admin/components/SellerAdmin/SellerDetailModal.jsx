import React, { useEffect, useState, useCallback } from "react";
import {
  Drawer,
  Tabs,
  Descriptions,
  Tag,
  Spin,
  Row,
  Col,
  Empty,
  message,
  Divider,
} from "antd";
import { ShopFilled, BankOutlined, IdcardOutlined } from "@ant-design/icons"; // Thêm icon
import axios from "axios";
import dayjs from "dayjs";
import NoImage from "../../../../components/shared/NoImage";

import ActivityTimeline from "./ActivityTimeline";
import SellerRejectionModal from "./SellerRejectionModal";
import PerformanceStats from "./PerformanceStats";
import FinanceStats from "./FinanceStats";
import ReviewStats from "./ReviewStats";
import ProductsTab from "./ProductsTab";
import OrdersTab from "./OrdersTabAdmin";
import { mockAnalyticsData } from "./mockData";

const { TabPane } = Tabs;

export default function SellerDetailDrawer({
  visible,
  onClose,
  seller: initialSeller,
  onApprove,
  onReject,
  onLock,
}) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [sellerData, setSellerData] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const fetchSellerDetail = useCallback(async (id) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/sellers/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSellerData(res.data);
    } catch (error) {
      console.error("Lỗi fetch seller detail", error);
    }
  }, []);

  const fetchAnalytics = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/sellers/analytics/${id}/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setAnalytics(res.data);
    } catch (err) {
      console.warn("Dùng mock analytics");
      setAnalytics(mockAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSeller?.id && visible) {
      fetchAnalytics(initialSeller.id);
      fetchSellerDetail(initialSeller.id);
    }
  }, [initialSeller?.id, visible, fetchSellerDetail]);

  const handleActionReject = async (reason) => {
    const target = sellerData || initialSeller;
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/sellers/${target.id}/reject/`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      message.success("Đã từ chối cửa hàng thành công!");
      setRejectModalVisible(false);
      fetchSellerDetail(target.id);
      onReject?.();
    } catch (error) {
      message.error(
        error?.response?.data?.detail || "Có lỗi khi từ chối cửa hàng!"
      );
    }
  };

  const currentSeller = sellerData || initialSeller;

  if (!currentSeller && visible) {
    return (
      <Drawer open={visible} onClose={onClose} width={1200} title="Đang tải...">
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      </Drawer>
    );
  }

  if (!currentSeller) return null;

  const formatDate = (date) =>
    date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—";

  const getStatusLabel = (status) =>
    ({
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      active: "Đang hoạt động",
      locked: "Đã khóa",
    })[status] || status;

  const getStatusColor = (status) =>
    ({
      pending: "#faad14",
      approved: "#52c41a",
      rejected: "#ff4d4f",
      active: "#1890ff",
      locked: "#ff7a45",
    })[status] || "#bfbfbf";

  const getBusinessTypeLabel = (type) =>
    ({
      personal: "Cá nhân",
      business: "Doanh nghiệp",
      household: "Hộ kinh doanh",
    })[type] || "—";

  const imgStyle = {
    width: "100%",
    maxHeight: 300,
    objectFit: "contain",
    borderRadius: 10,
    border: "1px solid #eee",
    background: "#fafafa",
  };

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      width={1200}
      title={`Chi tiết cửa hàng: ${currentSeller.store_name}`}
    >
      <Tabs defaultActiveKey="1" type="card">
        {/* TAB 1: THÔNG TIN CHUNG */}
        <TabPane
          tab={
            <span>
              <ShopFilled /> Thông tin chung
            </span>
          }
          key="1"
        >
          <Row gutter={24}>
            {/* Cột trái: Ảnh đại diện */}
            <Col span={5} style={{ textAlign: "center" }}>
              {currentSeller.image ? (
                <img
                  src={currentSeller.image}
                  alt="Store"
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "1px solid #eee",
                    marginBottom: 10,
                  }}
                />
              ) : (
                <NoImage width={150} height={150} />
              )}
              <Tag
                color={getStatusColor(currentSeller.status)}
                style={{ fontSize: 14, padding: "5px 15px", marginTop: 10 }}
              >
                {getStatusLabel(currentSeller.status).toUpperCase()}
              </Tag>
            </Col>

            {/* Cột phải: Thông tin chi tiết */}
            <Col span={19}>
              {/* 1. Thông tin hành chính */}
              <Descriptions
                title="Thông tin hành chính"
                bordered
                column={2}
                size="small"
                labelStyle={{ width: "160px", fontWeight: "500" }}
              >
                <Descriptions.Item label="Tên cửa hàng">
                  <span style={{ fontWeight: "bold", fontSize: 15 }}>
                    {currentSeller.store_name}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Chủ sở hữu">
                  {currentSeller.owner_username || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Hình thức">
                  {getBusinessTypeLabel(currentSeller.business_type)}
                </Descriptions.Item>
                
                {/* --- TRƯỜNG MỚI: CCCD/MST --- */}
                <Descriptions.Item label="Mã số thuế">
                  {currentSeller.tax_code || "—"}
                </Descriptions.Item>
                
                <Descriptions.Item label="Số CCCD/CMND">
                  {currentSeller.cid_number ? (
                    <span>
                      <IdcardOutlined style={{ marginRight: 5 }} />
                      {currentSeller.cid_number}
                    </span>
                  ) : (
                    "—"
                  )}
                </Descriptions.Item>
                {/* --------------------------- */}

                <Descriptions.Item label="Email">
                  {currentSeller.user_email || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {currentSeller.phone || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đăng ký">
                  {formatDate(currentSeller.created_at)}
                </Descriptions.Item>
                
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {currentSeller.address || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Giới thiệu" span={2}>
                  {currentSeller.bio || "—"}
                </Descriptions.Item>
              </Descriptions>

              {/* 2. Thông tin thanh toán (MỚI) */}
              <div style={{ marginTop: 24 }}>
                <Descriptions
                  title={
                    <span>
                      <BankOutlined style={{ marginRight: 8 }} />
                      Thông tin thanh toán
                    </span>
                  }
                  bordered
                  column={2}
                  size="small"
                  labelStyle={{ width: "160px", fontWeight: "500" }}
                >
                  <Descriptions.Item label="Ngân hàng">
                    {currentSeller.bank_name || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản">
                    <span style={{ fontWeight: "bold", color: "#1890ff" }}>
                      {currentSeller.bank_account_number || "—"}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên chủ TK">
                    <span style={{ textTransform: "uppercase" }}>
                      {currentSeller.bank_account_name || "—"}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* 3. Hồ sơ đính kèm */}
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 16 }}>Hồ sơ chứng từ</h4>
                <Row gutter={[16, 16]}>
                  {/* Cá nhân: CCCD trước + sau */}
                  {currentSeller.business_type === "personal" && (
                    <>
                      <Col xs={24} md={12}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                          CCCD mặt trước
                        </div>
                        {currentSeller.cccd_front ? (
                          <img
                            src={currentSeller.cccd_front}
                            alt="CCCD trước"
                            style={imgStyle}
                          />
                        ) : (
                          <Empty description="Không có ảnh" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </Col>

                      <Col xs={24} md={12}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                          CCCD mặt sau
                        </div>
                        {currentSeller.cccd_back ? (
                          <img
                            src={currentSeller.cccd_back}
                            alt="CCCD sau"
                            style={imgStyle}
                          />
                        ) : (
                          <Empty description="Không có ảnh" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </Col>
                    </>
                  )}

                  {/* Doanh nghiệp: GPKD */}
                  {["business", "household"].includes(
                    currentSeller.business_type
                  ) && (
                    <Col span={24}>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>
                        Giấy phép kinh doanh / ĐKKD
                      </div>
                      {currentSeller.business_license ? (
                        <img
                          src={currentSeller.business_license}
                          alt="GPKD"
                          style={{ ...imgStyle, maxHeight: 500 }}
                        />
                      ) : (
                        <Empty description="Không có giấy phép" />
                      )}
                    </Col>
                  )}
                </Row>
              </div>
            </Col>
          </Row>
        </TabPane>

        {/* Các tab khác giữ nguyên */}
        <TabPane tab="Sản phẩm" key="2">
          <ProductsTab sellerId={currentSeller.id} />
        </TabPane>
        <TabPane tab="Đơn hàng" key="3">
          <OrdersTab sellerId={currentSeller.id} />
        </TabPane>
        <TabPane tab="Hiệu suất" key="4">
          <PerformanceStats analytics={analytics} loading={loading} />
        </TabPane>
        <TabPane tab="Tài chính" key="5">
          <FinanceStats analytics={analytics} sellerId={currentSeller.id} />
        </TabPane>
        <TabPane tab="Đánh giá" key="6">
          <ReviewStats analytics={analytics} />
        </TabPane>
        <TabPane tab="Hoạt động" key="7">
          <ActivityTimeline sellerId={currentSeller.id} />
        </TabPane>
      </Tabs>

      <SellerRejectionModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        seller={currentSeller}
        onRejectSuccess={handleActionReject}
      />
    </Drawer>
  );
}