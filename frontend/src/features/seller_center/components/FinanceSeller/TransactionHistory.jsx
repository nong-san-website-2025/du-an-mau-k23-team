import React from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  THEME,
  TRANSACTION_TYPE_OPTIONS,
  QUICK_RANGE_OPTIONS,
  formatCurrency,
} from "../../utils/financeUtils";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function TransactionHistory({
  transactions, // Dữ liệu đã được lọc từ Parent
  loading,
  filters,
  setFilters,
  onQuickRangeChange,
  onDateChange,
  onTypeChange,
  onSearch,
}) {

  // --- COLUMN DEFINITION ---
  const tableColumns = [
    {
      title: "Mã GD / Thời gian",
      dataIndex: "createdAt",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>#{record.orderId || record.transactionId || "N/A"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(text).format("DD/MM/YYYY HH:mm")}</Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: "Loại giao dịch",
      dataIndex: "type",
      render: (type, record) => {
        const opt = TRANSACTION_TYPE_OPTIONS.find((o) => o.value === type) || {};
        return (
          <Space direction="vertical" size={0}>
            <Tag color={opt.color}>{opt.label || type}</Tag>
            <Text type="secondary" style={{ fontSize: 10 }}>{record.status}</Text>
          </Space>
        );
      },
    },
    {
      title: "Diễn giải",
      dataIndex: "description",
      ellipsis: true,
      render: (text) => <Text style={{ maxWidth: 200 }} ellipsis={{ tooltip: text }}>{text}</Text>
    },
    {
      title: "Giá trị",
      dataIndex: "amount",
      align: "right",
      render: (val, record) => (
        <Space direction="vertical" size={0} align="end">
          <Text strong style={{ color: val > 0 ? THEME.success : THEME.error, fontSize: 15 }}>
            {val > 0 ? "+" : ""}{formatCurrency(val)}
          </Text>
          {record.grossProfit > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }}>Lãi gộp: {formatCurrency(record.grossProfit)}</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Số dư sau GD",
      dataIndex: "balanceAfter",
      align: "right",
      render: (val) => <Text>{formatCurrency(val)}</Text>,
    },
  ];

  return (
    <Card
      style={{ marginTop: 24, borderRadius: 12 }}
      bordered={false}
      title={<Space><FilterOutlined style={{ color: THEME.primary }} /> Lịch sử giao dịch</Space>}
    >
      {/* Filter Bar */}
      <div style={{ marginBottom: 20 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8} lg={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm mã đơn, mã GD..."
              allowClear
              value={filters.searchText}
              onChange={onSearch}
            />
          </Col>
          <Col xs={24} md={8} lg={6}>
            <RangePicker
              style={{ width: "100%" }}
              value={filters.dateRange}
              onChange={onDateChange}
              format="DD/MM/YYYY"
              allowClear={false}
            />
          </Col>
          <Col xs={24} md={8} lg={6}>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Loại giao dịch"
              options={TRANSACTION_TYPE_OPTIONS}
              maxTagCount="responsive"
              value={filters.types}
              onChange={onTypeChange}
            />
          </Col>
          <Col xs={24} md={24} lg={6} style={{ textAlign: "right" }}>
            <Segmented
              options={QUICK_RANGE_OPTIONS}
              value={filters.quickRange}
              onChange={onQuickRangeChange}
            />
          </Col>
        </Row>
      </div>

      <Table
        columns={tableColumns}
        dataSource={transactions}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 800 }}
        rowKey="key"
        size="middle"
      />
    </Card>
  );
}