import React from "react";
import { Row, Col, Card, Button, Space, Tag, Divider, Typography } from "antd";
import { CreditCardOutlined, BankOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function BankAccounts({ bankAccounts = [] }) {
  return (
    <Card
      title={
        <Space>
          <CreditCardOutlined />
          <span>Tài khoản ngân hàng</span>
        </Space>
      }
      extra={<Button type="link">+ Thêm tài khoản</Button>}
      style={{ marginBottom: 24 }}
    >
      <Row gutter={[16, 16]}>
        {bankAccounts && bankAccounts.length > 0 ? (
          bankAccounts.map((account) => (
            <Col xs={24} md={12} key={account.key}>
              <Card
                size="small"
                bordered
                style={{
                  background: account.isDefault ? "#f6ffed" : "#fff",
                  borderColor: account.isDefault ? "#52c41a" : "#d9d9d9",
                }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <BankOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {account.bankName}
                      </Text>
                      {account.isDefault && (
                        <Tag color="success" style={{ marginLeft: 8 }}>
                          Mặc định
                        </Tag>
                      )}
                    </div>
                  </Space>
                  <Divider style={{ margin: "8px 0" }} />
                  <div>
                    <Text type="secondary">Số tài khoản: </Text>
                    <Text strong>{account.accountNumber}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Chủ tài khoản: </Text>
                    <Text strong>{account.accountName}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={24}>
            <Text type="secondary">Chưa có tài khoản ngân hàng nào</Text>
          </Col>
        )}
      </Row>
    </Card>
  );
}
