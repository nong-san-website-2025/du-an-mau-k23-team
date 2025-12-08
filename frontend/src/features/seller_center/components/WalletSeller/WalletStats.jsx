import React from "react";
import { Row, Col, Card, Statistic, Button, Alert } from "antd";
import {
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BankOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

export default function WalletStats({
  balance,
  pendingBalance,
  totalIncome,
  totalWithdrawn,
  onWithdrawClick,
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Thông báo */}
      <Alert
        message="Lưu ý"
        description="Số dư khả dụng có thể rút về tài khoản ngân hàng. Số dư đang chờ sẽ được chuyển sang khả dụng sau khi đơn hàng hoàn tất."
        type="info"
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Số dư khả dụng"
              value={balance}
              precision={0}
              valueStyle={{
                color: "#3f8600",
                fontSize: "28px",
                fontWeight: "bold",
              }}
              prefix={<WalletOutlined />}
              suffix="₫"
            />
            <Button
              type="primary"
              size="large"
              icon={<BankOutlined />}
              onClick={onWithdrawClick}
              style={{ marginTop: 16, width: "100%" }}
            >
              Rút tiền
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Số dư đang chờ"
              value={pendingBalance}
              precision={0}
              valueStyle={{ color: "#faad14", fontSize: "24px" }}
              prefix={<HistoryOutlined />}
              suffix="₫"
            />
            <div style={{ fontSize: 12, marginTop: 8, color: "rgba(0,0,0,0.45)" }}>
              Được chuyển sau khi giao hàng thành công
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Tổng thu nhập"
              value={totalIncome}
              precision={0}
              valueStyle={{ color: "#52c41a", fontSize: "24px" }}
              prefix={<ArrowUpOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Đã rút"
              value={totalWithdrawn}
              precision={0}
              valueStyle={{ color: "#1890ff", fontSize: "24px" }}
              prefix={<ArrowDownOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
