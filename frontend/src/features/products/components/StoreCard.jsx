import React from "react";
import { Card, Button, Image, Statistic, Row, Col, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const StoreCard = ({ store, productId }) => {
  const navigate = useNavigate();

  return (
    <Card style={{ marginTop: 24, borderRadius: 12 }}>
      {/* Hàng đầu: Avatar + Tên shop + Nút */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        {/* Avatar */}
        <Image
          src={store.image || "https://via.placeholder.com/80x80"}
          width={60}
          height={60}
          preview={false}
          style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />

        {/* Tên shop và nút */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 18, margin: 0 }}>
            {store.store_name}
          </Text>
          <Button
            type="primary"
            ghost
            size="small"
            onClick={() => navigate(`/store/${store.id}`, { state: { productId } })}
          >
            Xem shop
          </Button>
        </div>
      </div>

      {/* Dòng thống kê: 3 cột */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic
            title="Sản phẩm"
            value={store.total_products || 0}
            valueStyle={{ fontSize: 16, fontWeight: "normal" }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Theo dõi"
            value={store.followers_count || 0}
            valueStyle={{ fontSize: 16, fontWeight: "normal" }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Đánh giá"
            value={store.total_reviews || 0}
            valueStyle={{ fontSize: 16, fontWeight: "normal" }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default StoreCard;