// components/WalletSeller/WalletTransactions.jsx
import React from "react";
import {
  Table,
  Card,
  Tag,
  Typography,
  DatePicker,
  Input,
  Select,
  Space,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function WalletTransactions({
  loading,
  transactions, // Dữ liệu đã được fetch
  filterValues, // { search, status, dateRange }
  onFilterChange, // Hàm xử lý thay đổi bộ lọc
  onSearch, // Nhận hàm debounce
  pagination, // Nhận object pagination
  onChange, // Nhận hàm xử lý đổi trang
}) {
  const columns = [
    {
      title: "Mã GD",
      dataIndex: "id",
      key: "id",
      render: (text) => (
        <Text copyable code>
          {text}
        </Text>
      ),
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
          <Tag
            color={color}
            icon={icon}
            style={{ minWidth: 100, textAlign: "center" }}
          >
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
      title="Lịch sử giao dịch"
      bordered={false}
      style={{ borderRadius: 8 }}
    >
      <div
        style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        {/* Search Input */}
        <Input
          placeholder="Tìm mã đơn, nội dung..."
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          // onChange gọi hàm debounce
          onChange={(e) => onSearch(e.target.value)}
          // defaultValue để input không bị clear khi re-render
          defaultValue={filterValues.search}
        />

        {/* Các bộ lọc khác giữ nguyên logic gọi onFilterChange */}
        <Select
          placeholder="Loại giao dịch"
          style={{ width: 150 }}
          allowClear
          onChange={(val) => onFilterChange("status", val)}
        >
          <Select.Option value="income">Thu nhập</Select.Option>
          <Select.Option value="withdraw">Rút tiền</Select.Option>
        </Select>

        <RangePicker onChange={(dates) => onFilterChange("dateRange", dates)} />
      </div>

      <Table
        rowKey="key"
        loading={loading}
        columns={columns}
        dataSource={transactions}
        // Cấu hình Pagination Server-side
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} giao dịch`,
        }}
        // Sự kiện đổi trang
        onChange={onChange}
      />
    </Card>
  );
}
