import React from "react";
import {
  Card,
  Button,
  Spin,
  Row,
  Col,
  Alert,
  Typography,
  InputNumber,
  Space,
  Tag,
} from "antd";
import {
  DollarCircleOutlined,
  PlusCircleOutlined,
  WalletOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import WalletNotifications from "./WalletNotifications";

const { Title, Text } = Typography;

const mainColor = "#166534"; // Tím Indigo

// Hàm format tiền
const formatMoney = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function WalletTab({
  walletBalance,
  loadingWallet,
  rechargeAmount,
  setRechargeAmount,
  rechargeLoading,
  rechargeError,
  handleRecharge,
}) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 18,
        background: "#f9f9f9",
        padding: 12,
        boxShadow: "0 2px 10px rgba(75,0,130,0.08)",
      }}
    >
      {/* Header */}
      <Row align="middle" gutter={16} style={{ marginBottom: 24 }}>
        <Col>
          <div
            style={{
              background: mainColor,
              borderRadius: "50%",
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DollarCircleOutlined style={{ fontSize: 32, color: "#fff" }} />
          </div>
        </Col>
        <Col>
          <Title level={4} style={{ margin: 0, color: mainColor }}>
            GFarmPay
          </Title>
          <Text type="secondary">Quản lý ví điện tử của bạn</Text>
        </Col>
      </Row>

      {/* Số dư ví */}
      <Card
        style={{
          borderRadius: 6 ,
          marginBottom: 12,
          background: "#fff",
          border: `1px solid ${mainColor}20`,
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              
              <Text strong style={{ fontSize: 18, color: "#1C1C1C" }}>
                Số dư:
              </Text>
              {loadingWallet ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 20 }} spin />}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 500,
                    color: "#1C1C1C",
                  }}
                >
                  {walletBalance !== null
                    ? `${formatMoney(walletBalance)} ₫`
                    : "---"}
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Tag color="green" style={{ fontSize: 14 }}>
              Hoạt động
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Thông báo các yêu cầu đang chờ xử lý */}
      <WalletNotifications />

      {/* Nạp tiền */}
      <Title
        level={5}
        style={{ color: "#1C1C1C", marginBottom: 16, marginTop: 16 }}
      >
        Nạp tiền vào ví
      </Title>

      <Row gutter={[16, 16]}>
        {/* Mệnh giá nhanh */}
        <Col xs={24} md={10}>
          <Space wrap size="small">
            {[100000, 200000, 500000].map((value) => {
              const isSelected = parseInt(rechargeAmount) === value;
              return (
                <Button
                  key={value}
                  type={isSelected ? "primary" : "default"}
                  onClick={() => setRechargeAmount(value)}
                  style={{
                    borderColor: isSelected ? mainColor  : "#ccc" ,
                    color: isSelected ? "#fff" : "#1C1C1C",
                    background: isSelected ? mainColor : "#fff",
                    fontWeight: 600,
                    minWidth: 100,
                    borderRadius: 8,
                  }}
                  disabled={rechargeLoading}
                >
                  {formatMoney(value)} ₫
                </Button>
              );
            })}
          </Space>
        </Col>

        {/* Nhập số tiền & nút nạp */}
        <Col xs={24} md={14}>
          <Row gutter={12}>
            <Col flex="auto">
              <InputNumber
                style={{
                  width: "100%",
                  borderRadius: 8,
                  border: `1.5px solid ${mainColor}`,
                  fontWeight: 600,
                }}
                min={10000}
                max={300000000}
                placeholder="Nhập số tiền muốn nạp"
                value={rechargeAmount}
                onChange={(value) => setRechargeAmount(value)}
                disabled={rechargeLoading}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
              />
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={handleRecharge}
                loading={rechargeLoading}
                style={{
                  background: mainColor,
                  borderColor: mainColor,
                  fontWeight: 500,
                  borderRadius: 8,
                }}
              >
                Nạp tiền
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Thông báo lỗi */}
      {rechargeError && (
        <Alert
          message="Lỗi nạp tiền"
          description={rechargeError}
          type="error"
          showIcon
          style={{ marginTop: 16, borderRadius: 8 }}
        />
      )}

      <div style={{ color: "#888", fontSize: 13, marginTop: 12 }}>
        💡 Số tiền nạp tối thiểu <b>10.000 ₫</b>, tối đa <b>300.000.000 ₫</b>/lần.
      </div>
    </Card>
  );
}
