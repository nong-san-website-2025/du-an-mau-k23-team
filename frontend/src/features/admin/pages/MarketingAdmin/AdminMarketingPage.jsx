import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Typography,
  Modal,
  Row,
  Col,
  Tag,
  Image,
  Space,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";

import BannerForm from "../../components/MarketingAdmin/BannerForm";
import { getBanners } from "../../services/marketingApi";
import API from "../../../login_register/services/api";
import AdminPageLayout from "../../components/AdminPageLayout";

const { Title } = Typography;

const MarketingAdminPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await getBanners();
      setBanners(res.data);
    } catch (err) {
      console.error("Lỗi khi tải banner:", err);
      message.error("Không thể tải danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/marketing/banners/${id}/`);
      message.success("Xóa banner thành công");
      fetchBanners();
    } catch (err) {
      console.error("Lỗi xóa banner:", err.response?.data || err.message);
      const detail = err.response?.data?.detail || "Không thể xóa banner";
      message.error(`Xóa thất bại: ${detail}`);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBanner(null);
    fetchBanners();
  };

  const getPositionLabel = (position) => {
    const map = {
      hero: "Hero - Top",
      carousel: "Carousel",
      side: "Sidebar",
      mobile: "Mobile only",
      modal: "Modal Popup",
    };
    return map[position] || position;
  };

  const getPositionColor = (position) => {
    return position === "modal" ? "purple" : "blue";
  };

  // Hàm render card banner — dùng chung cho mọi khu vực
  const renderBannerCard = (banner) => {
    const isActive = banner.is_active;
    const positionLabel = getPositionLabel(banner.position);
    const positionColor = getPositionColor(banner.position);

    return (
      <Card
        hoverable
        cover={
          banner.image ? (
            <Image
              src={banner.image}
              alt={banner.title || "Banner"}
              style={{ height: 160, objectFit: "cover" }}
              fallback="/placeholder-banner.png"
            />
          ) : (
            <div
              style={{
                height: 160,
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
              }}
            >
              Không có ảnh
            </div>
          )
        }
        actions={[
          <Button
            type="link"
            size="small"
            key="edit"
            onClick={() => {
              setEditingBanner(banner);
              setShowForm(true);
            }}
          >
            Sửa
          </Button>,
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa banner này?"
            onConfirm={() => handleDelete(banner.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            key="delete"
          >
            <Button type="link" size="small" danger>
              Xóa
            </Button>
          </Popconfirm>,
        ]}
        style={{ borderRadius: 8 }}
      >
        <Card.Meta
          title={
            banner.title || <i style={{ color: "#999" }}>Không có tiêu đề</i>
          }
          description={
            <div style={{ fontSize: "13px", marginTop: 8 }}>
              <div>
                <strong>Vị trí:</strong>{" "}
                <Tag color={positionColor} style={{ marginRight: 0 }}>
                  {positionLabel}
                </Tag>
              </div>
              <div>
                <strong>Trạng thái:</strong>{" "}
                <Tag color={isActive ? "green" : "red"}>
                  {isActive ? "Đang hiện" : "Ẩn"}
                </Tag>
              </div>
              <div>
                <strong>Bắt đầu:</strong>{" "}
                {banner.start_at
                  ? moment(banner.start_at).format("DD/MM HH:mm")
                  : "Ngay lập tức"}
              </div>
              <div>
                <strong>Kết thúc:</strong>{" "}
                {banner.end_at
                  ? moment(banner.end_at).format("DD/MM HH:mm")
                  : "Vô hạn"}
              </div>
              {banner.click_url && (
                <div style={{ marginTop: 6 }}>
                  <strong>URL:</strong>{" "}
                  <a
                    href={banner.click_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12 }}
                  >
                    {banner.click_url}
                  </a>
                </div>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  // Phân nhóm banner theo vị trí
  const heroBanner = banners.find((b) => b.position === "hero");
  const sideBanners = banners
    .filter((b) => b.position === "carousel")
    .slice(0, 2); // Giới hạn 2 banner phụ
  const modalBanners = banners.filter((b) => b.position === "modal");

  const extra = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => {
        setEditingBanner(null);
        setShowForm(true);
      }}
    >
      Thêm Banner Mới
    </Button>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ BANNER & MODAL" extra={extra}>
      {/* Modal form */}
      <Modal
        title={editingBanner ? "Chỉnh sửa Banner" : "Tạo Banner Mới"}
        open={showForm}
        onCancel={() => setShowForm(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <BannerForm bannerId={editingBanner?.id} onSuccess={handleFormSuccess} />
      </Modal>

      {loading ? (
        <Card loading style={{ width: "100%" }} />
      ) : (
        <>
          {/* === Khu vực Hero + Carousel (Banner chính & phụ) === */}
          <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
            {/* Banner chính (Hero) */}
            <Col xs={24} lg={16}>
              <Title level={5} style={{ marginBottom: 16 }}>
                🖼️ Banner Chính (Hero)
              </Title>
              {heroBanner ? (
                renderBannerCard(heroBanner)
              ) : (
                <Card
                  style={{
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography.Text type="secondary">
                    Chưa có banner chính
                  </Typography.Text>
                </Card>
              )}
            </Col>

            {/* 2 Banner phụ (Carousel) */}
            <Col xs={24} lg={8}>
              <Title level={5} style={{ marginBottom: 16 }}>
                📌 Banner Phụ (Bên phải)
              </Title>
              {sideBanners.length > 0 ? (
                sideBanners.map((banner) => (
                  <div key={banner.id} style={{ marginBottom: 24 }}>
                    {renderBannerCard(banner)}
                  </div>
                ))
              ) : (
                <Card
                  style={{
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography.Text type="secondary">
                    Chưa có banner phụ
                  </Typography.Text>
                </Card>
              )}
            </Col>
          </Row>

          {/* === Khu vực Modal Popup === */}
          <div style={{ marginTop: 32 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              💬 Modal Popup
            </Title>
            {modalBanners.length > 0 ? (
              <Row gutter={[24, 24]}>
                {modalBanners.map((banner) => (
                  <Col xs={24} sm={12} md={8} key={banner.id}>
                    {renderBannerCard(banner)}
                  </Col>
                ))}
              </Row>
            ) : (
              <Card style={{ textAlign: "center", padding: "32px 0" }}>
                <Typography.Text type="secondary">
                  Chưa có modal popup. Banner có vị trí "Modal Popup" sẽ hiển thị ở đây.
                </Typography.Text>
              </Card>
            )}
          </div>
        </>
      )}
    </AdminPageLayout>
  );
};

export default MarketingAdminPage;