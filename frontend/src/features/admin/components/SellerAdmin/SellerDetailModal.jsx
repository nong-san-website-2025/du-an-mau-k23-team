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
} from "antd";
import { ShopFilled } from "@ant-design/icons";
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
  seller: initialSeller, // prop ban đầu từ danh sách
  onApprove,
  onReject,
  onLock,
}) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [sellerData, setSellerData] = useState(null); // dữ liệu mới nhất từ API detail
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  // Fetch chi tiết seller (có đầy đủ cccd_front, cccd_back, business_license)
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
      setSellerData(res.data); // ← Có đầy đủ URL ảnh từ Serializer
    } catch (error) {
      console.error("Lỗi tải chi tiết cửa hàng:", error);
      message.error("Không thể tải chi tiết cửa hàng");
      // Không set sellerData → vẫn dùng initialSeller để hiển thị cơ bản
    }
  }, []);

  // Fetch analytics
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

  // Gọi khi drawer mở hoặc seller thay đổi
  useEffect(() => {
    if (initialSeller?.id && visible) {
      fetchAnalytics(initialSeller.id);
      fetchSellerDetail(initialSeller.id);
    }
  }, [initialSeller?.id, visible, fetchSellerDetail]);

  // Xử lý từ chối
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
      fetchSellerDetail(target.id); // refresh lại
      onReject?.(); // callback cho component cha nếu cần
    } catch (error) {
      message.error(
        error?.response?.data?.detail || "Có lỗi khi từ chối cửa hàng!"
      );
    }
  };

  // Ưu tiên dữ liệu mới nhất
  const currentSeller = sellerData || initialSeller;

  // Nếu chưa có data gì cả và drawer đang mở → loading
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
          <Row gutter={20}>
            {/* Ảnh đại diện cửa hàng */}
            <Col span={5} style={{ textAlign: "center" }}>
              {currentSeller.image ? (
                <img
                  src={currentSeller.image}
                  alt="Store"
                  style={{
                    width: 200,
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "1px solid #eee",
                  }}
                />
              ) : (
                <NoImage width={150} height={150} />
              )}
            </Col>

            {/* Thông tin chi tiết */}
            <Col span={19}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Tên cửa hàng">
                  {currentSeller.store_name}
                </Descriptions.Item>
                <Descriptions.Item label="Chủ sở hữu">
                  {currentSeller.owner_username || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {currentSeller.user_email || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT">
                  {currentSeller.phone || "—"}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(currentSeller.status)}>
                    {getStatusLabel(currentSeller.status)}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Ngày tạo">
                  {formatDate(currentSeller.created_at)}
                </Descriptions.Item>

                <Descriptions.Item label="Địa chỉ" span={2}>
                  {currentSeller.address || "—"}
                </Descriptions.Item>

                <Descriptions.Item label="Hình thức kinh doanh">
                  {getBusinessTypeLabel(currentSeller.business_type)}
                </Descriptions.Item>

                <Descriptions.Item label="Mã số thuế">
                  {currentSeller.tax_code || "—"}
                </Descriptions.Item>
              </Descriptions>

              {/* HIỂN THỊ CCCD / GIẤY PHÉP KINH DOANH */}
              <div style={{ marginTop: 30 }}>
                <Row gutter={16}>
                  {/* Cá nhân: CCCD trước + sau */}
                  {currentSeller.business_type === "personal" && (
                    <>
                      <Col span={12}>
                        <p>
                          <strong>CCCD mặt trước</strong>
                        </p>
                        {currentSeller.cccd_front ? (
                          <img
                            src={currentSeller.cccd_front}
                            alt="CCCD mặt trước"
                            style={imgStyle}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/no-image.jpg";
                            }}
                          />
                        ) : (
                          <Empty description="Chưa tải lên CCCD mặt trước" />
                        )}
                      </Col>

                      <Col span={12}>
                        <p>
                          <strong>CCCD mặt sau</strong>
                        </p>
                        {currentSeller.cccd_back ? (
                          <img
                            src={currentSeller.cccd_back}
                            alt="CCCD mặt sau"
                            style={imgStyle}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/no-image.jpg";
                            }}
                          />
                        ) : (
                          <Empty description="Chưa tải lên CCCD mặt sau" />
                        )}
                      </Col>
                    </>
                  )}

                  {/* Doanh nghiệp / Hộ kinh doanh: Giấy phép kinh doanh */}
                  {["business", "household"].includes(
                    currentSeller.business_type
                  ) && (
                    <Col span={24}>
                      <p>
                        <strong>Giấy phép kinh doanh</strong>
                      </p>
                      {currentSeller.business_license ? (
                        <img
                          src={currentSeller.business_license}
                          alt="Giấy phép kinh doanh"
                          style={{ ...imgStyle, maxHeight: 500 }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/no-image.jpg";
                          }}
                        />
                      ) : (
                        <Empty description="Chưa tải lên giấy phép kinh doanh" />
                      )}
                    </Col>
                  )}
                </Row>
              </div>
            </Col>
          </Row>
        </TabPane>

        {/* Các tab khác */}
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

      {/* Modal từ chối */}
      <SellerRejectionModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        seller={currentSeller}
        onRejectSuccess={handleActionReject}
      />
    </Drawer>
  );
}
