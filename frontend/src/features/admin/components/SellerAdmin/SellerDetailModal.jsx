// src/components/SellerAdmin/SellerDetailModal.jsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  Tabs,
  Descriptions,
  Tag,
  Spin,
  Card,
  Statistic,
  Row,
  Col,
  Divider,
  Empty,
} from "antd";
import { Banknote, Clock4, DollarSign, Package, Star } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import NoImage from "../../../../components/shared/NoImage"; // sửa theo đường dẫn thật


import {
  AreaChartOutlined,
  ShopFilled,
  ShopOutlined,
  StarFilled,
} from "@ant-design/icons";
import ActivityTimeline from "./ActivityTimeline";

const { TabPane } = Tabs;

export default function SellerDetailModal({ visible, onClose, seller }) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (seller?.id && visible) {
      fetchAnalytics(seller.id);
    }
  }, [seller, visible]);

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
    } finally {
      setLoading(false);
    }
  };

  if (!seller) return null;

  const formatDate = (date) =>
    date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—";

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          Chi tiết cửa hàng: {seller.store_name}
        </div>
      }
      width={1200}
      footer={null}
      centered
      bodyStyle={{
        height: 500,
        overflowY: "auto",
        backgroundColor: "#fafafa",
        padding: "12px 16px",
      }}
      destroyOnClose
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Tabs defaultActiveKey="1" type="card">
          {/* 🏪 Thông tin chung */}
          <TabPane
            key="1"
            tab={
              <span>
                <ShopFilled /> {/* icon của Ant Design */}
                &nbsp; Thông tin chung
              </span>
            }
          >
            <Row gutter={24}>
              <Col span={6} style={{ textAlign: "center" }}>
                {seller.image ? (
                  <img
                    src={seller.image}
                    alt="Store"
                    style={{
                      width: 200,
                      height: 150,
                      objectFit: "cover",
                      borderRadius: "10%",
                      border: "3px solid #eee",
                      marginBottom: 12,
                    }}
                  />
                ) : (
                  <NoImage width={150} height={150} text="" />
                )}
              </Col>
              <Col span={18}>
                <Descriptions bordered size="middle" column={2}>
                  <Descriptions.Item label="Tên cửa hàng">
                    {seller.store_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Chủ sở hữu">
                    {seller.owner_username || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {seller.user_email || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="SĐT">
                    {seller.phone || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    {seller.address || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag
                      color={
                        seller.status === "active"
                          ? "green"
                          : seller.status === "pending"
                            ? "blue"
                            : "red"
                      }
                    >
                      {seller.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {formatDate(seller.created_at)}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </TabPane>

          {/* 📈 Hiệu suất kinh doanh */}
          <TabPane
            key="2"
            tab={
              <span>
                <AreaChartOutlined size={16} style={{ marginRight: 6 }} />
                Hiệu suất kinh doanh
              </span>
            }
          >
            {analytics ? (
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng sản phẩm"
                      value={analytics.overview.total_products}
                      prefix={<Package size={16} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Đang bán"
                      value={analytics.overview.active_products}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Đang ẩn"
                      value={analytics.overview.hidden_products}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng đơn hàng"
                      value={analytics.overview.total_orders}
                    />
                  </Card>
                </Col>
              </Row>
            ) : (
              <Empty style={{ marginTop: 50 }} />
            )}
          </TabPane>

          {/* 💰 Tài chính & Thanh toán */}
          <TabPane
            key="3"
            tab={
              <span>
                <DollarSign size={16} style={{ marginRight: 6 }} />
                Tài chính & Thanh toán
              </span>
            }
          >
            {analytics ? (
              <Row gutter={24}>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="Doanh thu tháng"
                      value={analytics.finance.total_revenue}
                      prefix={<Banknote size={16} />}
                      suffix="₫"
                      formatter={(value) =>
                        new Intl.NumberFormat("vi-VN").format(value)
                      }
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="Tổng doanh thu"
                      value={analytics.finance.total_revenue}
                      prefix={<Banknote size={16} />}
                      suffix="₫"
                      formatter={(value) =>
                        new Intl.NumberFormat("vi-VN").format(value)
                      }
                    />
                  </Card>
                </Col>
              </Row>
            ) : (
              <Empty style={{ marginTop: 50 }} />
            )}
          </TabPane>

          {/* ⭐ Đánh giá & Uy tín */}
          <TabPane
            key="4"
            tab={
              <span>
                <StarFilled size={16} style={{ marginRight: 6 }} />
                Đánh giá & Uy tín
              </span>
            }
          >
            {analytics ? (
              <Row gutter={24}>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="Điểm trung bình"
                      value={analytics.reviews.avg_rating}
                      precision={1}
                      prefix={<Star size={16} />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="Số lượt đánh giá"
                      value={analytics.reviews.total_reviews}
                    />
                  </Card>
                </Col>
              </Row>
            ) : (
              <Empty style={{ marginTop: 50 }} />
            )}
          </TabPane>

          {/* 🕓 Lịch sử hoạt động */}
          <TabPane
            key="5"
            tab={
              <span>
                <Clock4 size={16} style={{ marginRight: 6 }} />
                Lịch sử hoạt động
              </span>
            }
          >
            <Card>
              {loading ? (
                <Spin />
              ) : analytics ? (
                <ActivityTimeline sellerId={seller.id} />
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
}
