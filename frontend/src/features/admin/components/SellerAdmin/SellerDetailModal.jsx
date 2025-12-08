// src/components/SellerAdmin/SellerDetailDrawer.jsx
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

  const fetchSellerDetail = useCallback(async (id) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/sellers/${id}/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSellerData(res.data);
    } catch (error) {
      console.error("Error fetching seller detail:", error);
      setSellerData(seller); // Fallback to props
    }
  }, [seller]);

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
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Sử dụng mock data nếu API không hoạt động
      console.log("Đang sử dụng mock data cho analytics...");
      setAnalytics(mockAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  const handleActionApprove = async () => {
    setActionLoading(true);
    try {
      if (onApprove) {
        await onApprove({ ...currentSeller });
      }
      message.success("Đã duyệt cửa hàng thành công!");
      onClose();
    } catch (error) {
      console.error("Error approving seller:", error);
      message.error("Có lỗi xảy ra khi duyệt cửa hàng!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActionReject = async (reason) => {
    setActionLoading(true);
    try {
      if (onReject) {
        await onReject({ ...currentSeller, rejection_reason: reason });
      }
      message.success("Đã từ chối cửa hàng thành công!");
      setRejectModalVisible(false);
      onClose();
    } catch (error) {
      console.error("Error rejecting seller:", error);
      message.error("Có lỗi xảy ra khi từ chối cửa hàng!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActionLock = async () => {
    setActionLoading(true);
    try {
      if (onLock) {
        await onLock({ ...currentSeller });
      }
      message.success(
        currentSeller.status === "active"
          ? "Đã khóa cửa hàng thành công!"
          : "Đã mở khóa cửa hàng thành công!"
      );
      fetchSellerDetail(currentSeller.id);
      onClose();
    } catch (error) {
      console.error("Error locking seller:", error);
      message.error(
        currentSeller.status === "active"
          ? "Có lỗi xảy ra khi khóa cửa hàng!"
          : "Có lỗi xảy ra khi mở khóa cửa hàng!"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (!seller) return null;

  const currentSeller = sellerData || seller;

  const formatDate = (date) =>
    date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—";

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Chờ duyệt",
      approved: "Đẫ duyệt",
      rejected: "Từ chối",
      active: "Đang hoạt động",
      locked: "Đã khoá",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "#faad14", // Vàng - Chờ duyệt
      approved: "#52c41a", // Xanh lá - Đã duyệt
      rejected: "#ff4d4f", // Đỏ - Bị từ chối
      active: "#1890ff", // Xanh dương - Đang hoạt động
      locked: "#ff7a45", // Cam - Đã khóa
    };
    return colorMap[status] || "#bfbfbf";
  };

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      title={
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1f2937" }}>
          Chi tiết cửa hàng: {currentSeller.store_name}
        </div>
      }
      width={1200}
      placement="right"
      closable={true}
      maskClosable={true}
      destroyOnClose
      bodyStyle={{
        padding: 0,
        backgroundColor: "#fafafa",
        height: "100vh",
        overflow: "hidden", // ✅ Tắt cuộn ngang và dọc ban đầu
      }}
      headerStyle={{
        padding: "16px 24px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
      footer={
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Nút hành động bên trái */}
          <div style={{ display: "flex", gap: "8px", flex: 1 }}>
            {/* Nút Duyệt - hiển thị khi status là pending */}
            {onApprove && currentSeller.status === "pending" && (
              <Button
                type="primary"
                loading={actionLoading}
                onClick={handleActionApprove}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Duyệt cửa hàng
              </Button>
            )}

            {/* Nút Từ chối - hiển thị khi status là pending */}
            {onReject && currentSeller.status === "pending" && (
              <Button
                danger
                loading={actionLoading}
                onClick={() => setRejectModalVisible(true)}
              >
                Từ chối
              </Button>
            )}

            {/* Nút Khóa/Mở khóa - hiển thị khi status là active hoặc locked */}
            {onLock &&
              (currentSeller.status === "active" ||
                currentSeller.status === "locked") && (
                <Button
                  loading={actionLoading}
                  onClick={handleActionLock}
                  style={{
                    borderColor: currentSeller.status === "active" ? "#ff7a45" : "#1890ff",
                    color: currentSeller.status === "active" ? "#ff7a45" : "#1890ff",
                  }}
                >
                  {currentSeller.status === "active" ? "Khóa cửa hàng" : "Mở khóa"}
                </Button>
              )}
          </div>

          {/* Nút Đóng bên phải */}
          <Button onClick={onClose}>Đóng</Button>
        </div>
      }
    >
      {/* ✅ Container chính để kiểm soát cuộn dọc, ẩn ngang */}
      <div
        style={{
          height: "calc(100% - 60px)",
          overflowY: "auto", // ✅ Cho phép cuộn dọc
          overflowX: "hidden", // ✅ TUYỆT ĐỐI ẨN CUỘN NGANG
          WebkitOverflowScrolling: "touch", // Tối ưu cho iOS
          padding: "0 24px", // Đảm bảo không tràn do padding
          boxSizing: "border-box", // Đảm bảo padding không làm tràn width
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              padding: 80,
            }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <Tabs
            defaultActiveKey="1"
            type="card"
            style={{
              height: "100%",
              backgroundColor: "#fafafa",
              overflow: "visible", // Đảm bảo tab không bị cắt
            }}
            tabBarStyle={{
              margin: 0,
              padding: "0 24px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e5e7eb",
              whiteSpace: "nowrap", // Ngăn tab bị dồn vào 1 dòng gây tràn
            }}
            contentStyle={{
              padding: "24px",
              height: "calc(100% - 48px)",
              overflowY: "auto",
              overflowX: "hidden", // ✅ Ẩn cuộn ngang trong nội dung tab
              boxSizing: "border-box",
            }}
          >
            {/* 🏪 Thông tin chung */}
            <TabPane
              key="1"
              tab={
                <span>
                  <ShopFilled style={{ fontSize: "16px", color: "#1890ff" }} />
                  &nbsp; Thông tin chung
                </span>
              }
            >
              <Row gutter={18}>
                <Col span={4} style={{ textAlign: "center" }}>
                  {currentSeller.image ? (
                    <img
                      src={currentSeller.image}
                      alt="Store"
                      style={{
                        width: 200,
                        height: 150,
                        objectFit: "cover",
                        borderRadius: "10%",
                        border: "3px solid #eee",
                        marginBottom: 12,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 200,
                        height: 150,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "10%",
                        border: "3px solid #eee",
                        marginBottom: 12,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <NoImage width={150} height={150} text="" />
                    </div>
                  )}
                </Col>
                <Col span={20}>
                  <Descriptions
                    bordered
                    size="middle"
                    column={2}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <Descriptions.Item
                      label="Tên cửa hàng"
                      style={{ fontWeight: 500 }}
                    >
                      {currentSeller.store_name}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label="Chủ sở hữu"
                      style={{ fontWeight: 500 }}
                    >
                      {currentSeller.owner_username || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label="Email"
                      style={{ fontWeight: 500 }}
                    >
                      {currentSeller.user_email || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="SĐT" style={{ fontWeight: 500 }}>
                      {currentSeller.phone || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label="Trạng thái"
                      style={{ fontWeight: 500 }}
                    >
                      <Tag
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "6px 12px",
                          backgroundColor: getStatusColor(currentSeller.status),
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        {getStatusLabel(currentSeller.status)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label="Ngày tạo"
                      style={{ fontWeight: 500 }}
                    >
                      {formatDate(currentSeller.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label="Địa chỉ"
                      span={2}
                      style={{ fontWeight: 500 }}
                    >
                      {currentSeller.address || "—"}
                    </Descriptions.Item>
                  </Descriptions>

                  {/* Lý do từ chối - hiển thị riêng biệt để tránh ảnh hưởng layout */}
                  {currentSeller.status === "rejected" &&
                    currentSeller.rejection_reason && (
                      <div
                        style={{
                          marginTop: "16px",
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            marginBottom: "8px",
                            color: "#1f2937",
                          }}
                        >
                          Lý do từ chối
                        </div>
                        <div
                          style={{
                            backgroundColor: "#fff2f0",
                            padding: "12px",
                            borderRadius: "6px",
                          }}
                        >
                          <div
                            style={{
                              color: "#ff4d4f",
                              whiteSpace: "pre-wrap",
                              wordWrap: "break-word",
                              maxHeight: "100px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              lineHeight: "1.5",
                              marginBottom:
                                currentSeller.rejection_reason?.length > 150
                                  ? "12px"
                                  : "0",
                            }}
                          >
                            {currentSeller.rejection_reason}
                          </div>
                          {currentSeller.rejection_reason?.length > 150 && (
                            <Button
                              type="primary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Opening rejection modal");
                                setRejectionDetailModalVisible(true);
                              }}
                              style={{
                                backgroundColor: "#ff4d4f",
                                borderColor: "#ff4d4f",
                                width: "100%",
                              }}
                            >
                              Xem toàn bộ lý do
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                </Col>
              </Row>

              {/* Modal hiển thị lý do từ chối toàn bộ */}
              <Modal
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <ExclamationCircleOutlined
                      style={{ color: "#ff4d4f", fontSize: 18 }}
                    />
                    <span>Lý do từ chối cửa hàng</span>
                  </div>
                }
                open={rejectionDetailModalVisible}
                onCancel={() => setRejectionDetailModalVisible(false)}
                width={700}
                footer={null}
                centered
              >
                <div
                  style={{
                    backgroundColor: "#fff2f0",
                    padding: "16px",
                    borderRadius: "8px",
                    minHeight: "150px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    color: "#ff4d4f",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    lineHeight: "1.6",
                  }}
                >
                  {currentSeller.rejection_reason}
                </div>
              </Modal>
            </TabPane>

             <TabPane
              key="2"
              tab={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Package
                    size={16}
                    style={{ marginRight: 6, color: "#8b5cf6" }}
                  />
                  Sản phẩm
                </span>
              }
            >
              <ProductsTab sellerId={currentSeller.id} />
            </TabPane>

            {/* 🛒 Đơn hàng */}
            <TabPane
              key="3"
              tab={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ShoppingCart
                    size={16}
                    style={{ marginRight: 6, color: "#06b6d4" }}
                  />
                  Đơn hàng
                </span>
              }
            >
              <OrdersTab sellerId={currentSeller.id} />
            </TabPane>

            {/* 📈 Hiệu suất kinh doanh */}
            <TabPane
              key="4"
              tab={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <AreaChartOutlined
                    style={{
                      marginRight: 6,
                      color: "#52c41a",
                      fontSize: "16px",
                    }}
                  />
                  Hiệu suất kinh doanh
                </span>
              }
            >
              <PerformanceStats analytics={analytics} />
            </TabPane>

            {/* 💰 Tài chính & Thanh toán */}
            <TabPane
              key="5"
              tab={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <DollarSign
                    size={16}
                    style={{ marginRight: 6, color: "#10b981" }}
                  />
                  Tài chính
                </span>
              }
            >
              <FinanceStats analytics={analytics} sellerId={currentSeller.id} />
            </TabPane>

            {/* ⭐ Đánh giá & Uy tín */}
            <TabPane
              key="6"
              tab={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <StarFilled
                    style={{
                      marginRight: 6,
                      color: "#f59e0b",
                      fontSize: "16px",
                    }}
                  />
                  Đánh giá
                </span>
              }
            >
              <ReviewStats analytics={analytics} />
            </TabPane>

            {/* 🕓 Lịch sử hoạt động */}
            <TabPane
              key="7"
              tab={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Clock4
                    size={16}
                    style={{ marginRight: 6, color: "#6b7280" }}
                  />
                  Lịch sử hoạt động
                </span>
              }
            >
              <Card
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "200px",
                    }}
                  >
                    <Spin />
                  </div>
                ) : analytics ? (
                  <ActivityTimeline sellerId={seller.id} />
                ) : (
                  <Empty
                    description="Không có dữ liệu lịch sử hoạt động"
                    style={{ marginTop: 50 }}
                  />
                )}
              </Card>
            </TabPane>

            {/* 📦 Danh sách sản phẩm */}
           
          </Tabs>
        )}
      </div>

      {/* Rejection Modal */}
      <SellerRejectionModal
        visible={rejectModalVisible}
        onClose={() => setRejectModalVisible(false)}
        seller={currentSeller}
        onRejectSuccess={async (rejectionReason) => {
          await handleActionReject(rejectionReason);
        }}
      />
    </Drawer>
  );
}
