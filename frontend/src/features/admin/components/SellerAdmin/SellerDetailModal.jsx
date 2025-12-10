import React, { useEffect, useState, useCallback } from "react";
import {
  Drawer,
  Tabs,
  Descriptions,
  Tag,
  Spin,
  Card,
  Row,
  Col,
  Empty,
  Modal,
  Button,
  message,
} from "antd";
import { Clock4, DollarSign, Package, ShoppingCart } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import NoImage from "../../../../components/shared/NoImage";

import {
  AreaChartOutlined,
  ShopFilled,
  StarFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
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
  seller,
  onApprove,
  onReject,
  onLock,
}) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [sellerData, setSellerData] = useState(seller);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionDetailModalVisible, setRejectionDetailModalVisible] =
    useState(false);

  const fetchSellerDetail = useCallback(
    async (id) => {
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
        console.error("Error fetching seller detail:", error);
        setSellerData(seller);
      }
    },
    [seller]
  );

  useEffect(() => {
    if (seller?.id && visible) {
      fetchAnalytics(seller.id);
      fetchSellerDetail(seller.id);
    }
  }, [seller, visible, fetchSellerDetail]);

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
    } catch {
      setAnalytics(mockAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  const handleActionReject = async (reason) => {
    const sellerTarget = sellerData || seller;

    try {
      // ✅ Gọi đúng API backend luôn tại đây
      await axios.post(
        `${process.env.REACT_APP_API_URL}/sellers/${sellerTarget.id}/reject/`,
        {
          reason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      message.success("Đã từ chối cửa hàng thành công!");
      setRejectModalVisible(false);
      fetchSellerDetail(sellerTarget.id); // refresh lại trạng thái
    } catch (error) {
      console.error("❌ Reject error:", error?.response?.data || error);
      message.error(
        error?.response?.data?.detail || "Có lỗi khi từ chối cửa hàng!"
      );
    }
  };

  const currentSeller = sellerData || seller;
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

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      width={1200}
      title={`Chi tiết cửa hàng: ${currentSeller.store_name}`}
    >
      <Tabs defaultActiveKey="1" type="card">
        {/* 🔹 TAB 1: THÔNG TIN CHUNG */}
        <TabPane
          tab={
            <span>
              <ShopFilled /> Thông tin chung
            </span>
          }
          key="1"
        >
          <Row gutter={20}>
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

                <Descriptions.Item label="Loại đối tượng">
                  {getBusinessTypeLabel(currentSeller.business_type)}
                </Descriptions.Item>

                <Descriptions.Item label="Mã số thuế">
                  {currentSeller.tax_code || "—"}
                </Descriptions.Item>
              </Descriptions>

              {/* ✅ HIỂN THỊ CCCD / GPKD */}

              <div style={{ marginTop: 20 }}>
                <Row gutter={16}>
                  {currentSeller.business_type === "personal" && (
                    <>
                      <Col span={12}>
                        <p>CCCD mặt trước</p>
                        {currentSeller.cccd_front ? (
                          <img
                            src={currentSeller.cccd_front}
                            style={imgStyle}
                            alt="CCCD mặt trước"
                          />
                        ) : (
                          <Empty description="Chưa có ảnh CCCD mặt trước" />
                        )}
                      </Col>

                      <Col span={12}>
                        <p>CCCD mặt sau</p>
                        {currentSeller.cccd_back ? (
                          <img
                            src={currentSeller.cccd_back}
                            style={imgStyle}
                            alt="CCCD mặt sau"
                          />
                        ) : (
                          <Empty description="Chưa có ảnh CCCD mặt sau" />
                        )}
                      </Col>
                    </>
                  )}

                  {["business", "household"].includes(
                    currentSeller.business_type
                  ) && (
                    <Col span={24}>
                      <p>Giấy phép kinh doanh</p>
                      {currentSeller.business_license ? (
                        <img
                          src={currentSeller.business_license}
                          style={imgStyle}
                          alt="Giấy phép kinh doanh"
                        />
                      ) : (
                        <Empty description="Chưa có ảnh giấy phép kinh doanh" />
                      )}
                    </Col>
                  )}
                </Row>
              </div>
            </Col>
          </Row>
        </TabPane>

        {/* Các tab còn lại giữ nguyên */}
        <TabPane tab="Sản phẩm" key="2">
          <ProductsTab sellerId={currentSeller.id} /> 
        </TabPane>

        <TabPane tab="Đơn hàng" key="3">
          <OrdersTab sellerId={currentSeller.id} />
        </TabPane>

        <TabPane tab="Hiệu suất" key="4">
          <PerformanceStats analytics={analytics} />
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
        onRejectSuccess={(reason) => handleActionReject(reason)}
      />
    </Drawer>
  );
}

const imgStyle = {
  width: "100%",
  maxHeight: 220,
  objectFit: "contain",
  borderRadius: 10,
  border: "1px solid #eee",
};
