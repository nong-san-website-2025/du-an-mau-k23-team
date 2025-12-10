// components/WalletSeller/WalletStats.jsx
import React from "react";
import { Row, Col, Card, Statistic, Button, Tooltip, Typography } from "antd";
import {
  WalletOutlined,
  BankOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function WalletStats({
  balance,
  pendingBalance,
  totalIncome,
  totalWithdrawn,
  onWithdrawClick,
  loading,
}) {
  return (
    <Row gutter={[24, 24]}>
      {/* Số dư khả dụng - Card chính nổi bật nhất */}
      <Col xs={24} md={12} lg={6}>
        <Card
          bordered={false}
          loading={loading}
          style={{
            height: "100%",
            background: "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)",
            border: "1px solid #b7eb8f",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Statistic
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <WalletOutlined style={{ color: "#52c41a" }} />
                <Text strong type="success">SỐ DƯ KHẢ DỤNG</Text>
              </div>
            }
            value={balance}
            precision={0}
            valueStyle={{
              color: "#389e0d",
              fontSize: "28px",
              fontWeight: 700,
            }}
            suffix="₫"
          />
          <Button
            type="primary"
            icon={<BankOutlined />}
            block
            style={{ marginTop: 16, height: 40, borderRadius: 6 }}
            onClick={onWithdrawClick}
            disabled={balance < 100000} // Ví dụ: khóa nút nếu dưới mức rút tối thiểu
          >
            Rút tiền về Bank
          </Button>
          <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c", textAlign: 'center' }}>
            Tối thiểu 100.000₫
          </div>
        </Card>
      </Col>

      {/* Số dư đang chờ */}
      <Col xs={24} md={12} lg={6}>
        <Card bordered={false} loading={loading} hoverable style={{ height: "100%" }}>
          <Statistic
            title={
              <Tooltip title="Tiền từ đơn hàng đang vận chuyển hoặc chưa đối soát">
                <div style={{ cursor: "help", display: "flex", alignItems: "center", gap: 8 }}>
                  <ClockCircleOutlined style={{ color: "#faad14" }} />
                  <span style={{ color: "#666" }}>Đang chờ xử lý</span>
                  <InfoCircleOutlined style={{ fontSize: 12, color: "#bfbfbf" }} />
                </div>
              </Tooltip>
            }
            value={pendingBalance}
            precision={0}
            valueStyle={{ color: "#faad14", fontWeight: 600 }}
            suffix="₫"
          />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Sẽ chuyển sang khả dụng sau khi đơn hàng hoàn tất (24-48h).
            </Text>
          </div>
        </Card>
      </Col>

      {/* Tổng thu nhập */}
      <Col xs={24} md={12} lg={6}>
        <Card bordered={false} loading={loading} hoverable style={{ height: "100%" }}>
          <Statistic
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RiseOutlined style={{ color: "#1890ff" }} />
                <span style={{ color: "#666" }}>Tổng thu nhập</span>
              </div>
            }
            value={totalIncome}
            precision={0}
            valueStyle={{ color: "#1890ff", fontWeight: 600 }}
            suffix="₫"
          />
           <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Tổng doanh thu từ tất cả đơn hàng thành công.
            </Text>
          </div>
        </Card>
      </Col>

      {/* Đã rút */}
      <Col xs={24} md={12} lg={6}>
        <Card bordered={false} loading={loading} hoverable style={{ height: "100%" }}>
          <Statistic
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FallOutlined style={{ color: "#ff4d4f" }} />
                <span style={{ color: "#666" }}>Đã rút về</span>
              </div>
            }
            value={totalWithdrawn}
            precision={0}
            valueStyle={{ color: "#595959", fontWeight: 600 }}
            suffix="₫"
          />
           <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Tổng số tiền đã được giải ngân về tài khoản ngân hàng.
            </Text>
          </div>
        </Card>
      </Col>
    </Row>
  );
}