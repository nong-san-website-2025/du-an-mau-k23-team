// components/WalletSeller/WalletTransactions.jsx
import React from "react";
import { Table, Card, Tag, Typography, DatePicker, Input, Select, Space, Row, Col } from "antd";
import {
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
  FileTextOutlined
} from "@ant-design/icons";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function WalletTransactions({
  loading,
  transactions, // Dữ liệu đã được fetch
  filterValues, // { search, status, dateRange }
  onFilterChange, // Hàm xử lý thay đổi bộ lọc
}) {
  const columns = [
    {
      title: "Mã GD",
      dataIndex: "id",
      key: "id",
      render: (text) => <Text copyable code>{text}</Text>,
    },
    {
      title: "Loại giao dịch",
      dataIndex: "transaction_type",
      key: "transaction_type",
      render: (type) => {
        let color = "default";
        let icon = null;
        let text = type;

        switch (type) {
          case "payment":
          case "withdraw":
          case "refund_deduct":
          case "platform_fee":
            color = "error";
            icon = <ArrowDownOutlined />;
            if (type === "withdraw") text = "Rút tiền";
            else if (type === "refund_deduct") text = "Hoàn tiền đơn hàng";
            else if (type === "platform_fee") text = "Phí sàn";
            else text = "Thanh toán";
            break;
          case "income":
          case "deposit":
          case "add":
          case "refund":
          case "sale_income":
          case "pending_income":
            color = "success";
            icon = <ArrowUpOutlined />;
            if (type === "income" || type === "sale_income") text = "Doanh thu";
            else if (type === "pending_income") text = "Doanh thu chờ";
            else if (type === "deposit" || type === "add") text = "Cộng tiền";
            else text = "Hoàn tiền";
            break;
          case "pending":
            color = "warning";
            icon = <HistoryOutlined />;
            text = "Đang xử lý";
            break;
          default:
            break;
        }

        return (
          <Tag color={color} icon={icon} style={{ minWidth: 100, textAlign: 'center' }}>
            {text.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount, record) => {
        const isNegative = ["payment", "withdraw", "refund_deduct", "platform_fee"].includes(record.transaction_type);
        const color = isNegative ? "#ff4d4f" : "#52c41a";
        const prefix = isNegative ? "-" : "+";
        return (
          <Text strong style={{ color, fontSize: 15 }}>
            {prefix} {parseFloat(Math.abs(amount)).toLocaleString("vi-VN")} ₫
          </Text>
        );
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 300,
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <span style={{ color: "#8c8c8c" }}>
          {new Date(date).toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Lịch sử giao dịch</span>
        </Space>
      }
      bordered={false}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {/* Thanh bộ lọc */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Input
            placeholder="Tìm kiếm mã GD, nội dung..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            allowClear
            onChange={(e) => onFilterChange("search", e.target.value)}
          />
        </Col>
        <Col xs={24} md={6}>
          <Select
            placeholder="Loại giao dịch"
            allowClear
            style={{ width: "100%" }}
            onChange={(val) => onFilterChange("status", val)}
          >
            <Option value="payment">Thanh toán</Option>
            <Option value="withdraw">Rút tiền</Option>
            <Option value="pending">Đang xử lý</Option>
          </Select>
        </Col>
        <Col xs={24} md={10}>
          <RangePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            onChange={(dates) => onFilterChange("dateRange", dates)}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} giao dịch`,
          showSizeChanger: true,
        }}
      />
    </Card>
  );
}