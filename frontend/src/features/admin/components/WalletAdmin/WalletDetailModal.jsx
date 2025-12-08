import React, { useEffect, useState } from "react";
import {
  Drawer,
  Descriptions,
  Table,
  Skeleton,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Divider,
  Space,
  Typography,
} from "antd";
import {
  DollarSign,
  Clock,
  TrendingUp,
  PlusCircle,
  MinusCircle,
  ArrowDownCircle,
  Clock4,
} from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const WalletDetailDrawer = ({ visible, onClose, wallet }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (wallet?.seller_id && visible) {
      fetchTransactions(wallet.seller_id);
    }
  }, [wallet, visible]);

  const fetchTransactions = async (sellerId) => {
    setLoading(true);
    try {
      const res = await api.get(`payments/wallets/${sellerId}/transactions/`, {
        headers: getAuthHeaders(),
      });
      setTransactions(res.data?.transactions || res.data || []);
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const typeMap = {
    pending_add: {
      text: "Chờ cộng",
      color: "orange",
      icon: <Clock4 size={16} />,
    },
    add: {
      text: "Cộng tiền",
      color: "green",
      icon: <PlusCircle size={16} />,
    },
    deduct: {
      text: "Trừ tiền",
      color: "red",
      icon: <MinusCircle size={16} />,
    },
    withdraw: {
      text: "Rút tiền",
      color: "blue",
      icon: <ArrowDownCircle size={16} />,
    },
  };

  const transactionColumns = [
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const info = typeMap[type] || {};
        return (
          <Space>
            {info.icon}
            <Tag color={info.color}>{info.text}</Tag>
          </Space>
        );
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount) => (
        <Text strong>{amount?.toLocaleString()} đ</Text>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note) => note || "—",
    },
  ];

  if (!wallet) return null;

  return (
    <Drawer
      title={
        <Title level={4} style={{ margin: 0 }}>
          Ví của {wallet.store_name}
        </Title>
      }
      placement="right"
      open={visible}
      onClose={onClose}
      width={900}
      bodyStyle={{ padding: 24 }}
    >
      {/* Tổng quan số dư */}
      <Row gutter={16} style={{ marginBottom: 32 }}>
        <Col span={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, background: "#f6ffed" }}
          >
            <Statistic
              title="Số dư khả dụng"
              value={wallet.balance || 0}
              prefix={<DollarSign size={18} />}
              suffix="đ"
              valueStyle={{ color: "#52c41a", fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, background: "#fffbe6" }}
          >
            <Statistic
              title="Số dư chờ duyệt"
              value={wallet.pending_balance || 0}
              prefix={<Clock size={18} />}
              suffix="đ"
              valueStyle={{ color: "#faad14", fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, background: "#e6f7ff" }}
          >
            <Statistic
              title="Tổng số dư"
              value={(wallet.balance || 0) + (wallet.pending_balance || 0)}
              prefix={<TrendingUp size={18} />}
              suffix="đ"
              valueStyle={{ color: "#1890ff", fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Thông tin Seller */}
      <Title level={5}>Thông tin Seller</Title>
      <Descriptions
        column={2}
        labelStyle={{ fontWeight: 600 }}
        style={{ marginBottom: 32 }}
      >
        <Descriptions.Item label="ID Seller">
          {wallet.seller_id}
        </Descriptions.Item>
        <Descriptions.Item label="Tên cửa hàng">
          {wallet.store_name}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {wallet.email || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Cập nhật cuối">
          {wallet.updated_at
            ? dayjs(wallet.updated_at).format("DD/MM/YYYY HH:mm")
            : "—"}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Lịch sử giao dịch */}
      <Card
        title="Lịch sử giao dịch"
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        {loading ? (
          <Skeleton active />
        ) : (
          <Table
            columns={transactionColumns}
            dataSource={transactions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        )}
      </Card>
    </Drawer>
  );
};

export default WalletDetailDrawer;
