// components/WalletSeller/BankAccounts.jsx
import React from "react";
import { Card, Button, Row, Col, Typography, Tag, Empty, Space } from "antd";
import { PlusOutlined, CreditCardOutlined, CheckCircleFilled } from "@ant-design/icons";

const { Text, Title } = Typography;

export default function BankAccounts({ bankAccounts = [] }) {
  return (
    <Card
      title={
        <Space>
          <CreditCardOutlined />
          <span>Tài khoản ngân hàng liên kết</span>
        </Space>
      }
      extra={
        <Button type="dashed" icon={<PlusOutlined />} size="small">
          Thêm tài khoản
        </Button>
      }
      bordered={false}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {bankAccounts.length === 0 ? (
        <Empty description="Chưa có tài khoản ngân hàng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Row gutter={[16, 16]}>
          {bankAccounts.map((acc) => (
            <Col xs={24} md={12} lg={8} key={acc.key}>
              <div
                style={{
                  border: acc.isDefault ? "1px solid #b7eb8f" : "1px solid #f0f0f0",
                  borderRadius: 12,
                  padding: 20,
                  position: "relative",
                  background: acc.isDefault 
                    ? "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)" 
                    : "#fff",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                className="bank-card-hover" // Bạn có thể thêm CSS hover effect ở file global
              >
                {acc.isDefault && (
                  <Tag 
                    color="success" 
                    icon={<CheckCircleFilled />} 
                    style={{ position: "absolute", top: 12, right: 12, margin: 0 }}
                  >
                    Mặc định
                  </Tag>
                )}
                
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>NGÂN HÀNG</Text>
                  <Title level={5} style={{ margin: 0, color: "#1890ff" }}>
                    {acc.bankName.toUpperCase()}
                  </Title>
                </div>

                <div style={{ marginBottom: 16 }}>
                   <Text type="secondary" style={{ fontSize: 12 }}>SỐ TÀI KHOẢN</Text>
                   <div style={{ fontSize: 18, fontFamily: "monospace", letterSpacing: 1, fontWeight: 600 }}>
                     {acc.accountNumber}
                   </div>
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>CHỦ TÀI KHOẢN</Text>
                  <div style={{ fontWeight: 500 }}>{acc.accountName.toUpperCase()}</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
}