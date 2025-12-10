import React, { useEffect, useState } from "react";
import {
  Drawer,
  Table,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Space,
  Typography,
  Tabs,
  Button,
  message,
  Popconfirm,
  Skeleton
} from "antd";
import {
  DollarSign,
  Clock,
  PlusCircle,
  MinusCircle,
  ArrowDownCircle,
  CheckCircleOutlined,
} from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { CheckCircleFilled } from "@ant-design/icons";
import { intcomma } from './../../../../utils/format';

const { Title, Text } = Typography;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// Thêm prop onSuccess để gọi lại reload ở trang cha
const WalletDetailModal = ({ visible, onClose, wallet, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [approvingId, setApprovingId] = useState(null);

  // Load lại dữ liệu mỗi khi mở drawer
  useEffect(() => {
    if (wallet?.seller_id && visible) {
      fetchDetailData();
    }
  }, [wallet, visible]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const sellerId = wallet.seller_id;
      // Gọi song song 2 API
      const [transRes, pendingRes] = await Promise.all([
        api.get(`payments/wallets/${sellerId}/transactions/`, { headers: getAuthHeaders() }),
        api.get(`payments/wallets/${sellerId}/pending-orders/`, { headers: getAuthHeaders() })
      ]);

      setTransactions(transRes.data?.transactions || []);
      setPendingOrders(pendingRes.data?.pending_orders || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được chi tiết ví");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    setApprovingId(orderId);
    try {
      await api.post(
        `payments/wallets/approve-order/${orderId}/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã duyệt doanh thu đơn hàng #${orderId}`);
      
      // 1. Tải lại dữ liệu trong Drawer (để mất dòng đơn hàng đó)
      await fetchDetailData(); 
      
      // 2. Báo cho trang cha load lại bảng tổng (để giảm số pending bên ngoài)
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || "Lỗi khi duyệt");
    } finally {
      setApprovingId(null);
    }
  };

  // --- CỘT BẢNG ĐƠN HÀNG CHỜ ---
  const pendingColumns = [
    {
      title: "Mã Đơn",
      dataIndex: "id",
      key: "id",
      render: (text) => <Text strong>#{text}</Text>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Tổng đơn",
      dataIndex: "total_order_value",
      align: "right",
      render: (val) => val?.toLocaleString() + " đ",
    },
    {
      title: "Thực nhận (Sau phí)",
      dataIndex: "net_income",
      align: "right",
      render: (val) => <Text  strong>{intcomma(val)} đ</Text>,
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Popconfirm
          title="Xác nhận duyệt tiền?"
          description={`Cộng ${record.net_income?.toLocaleString()}đ vào ví seller?`}
          onConfirm={() => handleApproveOrder(record.id)}
          okText="Duyệt"
          cancelText="Huỷ"
        >
          <Button 
            type="primary" 
            size="small" 
            icon={<CheckCircleFilled />}
            loading={approvingId === record.id}
          >
            Duyệt
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // --- CỘT BẢNG LỊCH SỬ ---
  const historyColumns = [
    {
      title: "Ngày",
      dataIndex: "created_at",
      render: (d) => dayjs(d).format("DD/MM HH:mm"),
    },
    {
      title: "Loại",
      dataIndex: "type",
      render: (type) => {
        if(type === 'add') return <Tag color="green" icon={<PlusCircle size={14}/>}>Cộng tiền</Tag>;
        if(type === 'withdraw') return <Tag color="blue" icon={<ArrowDownCircle size={14}/>}>Rút tiền</Tag>;
        return <Tag>{type}</Tag>;
      }
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      align: "right",
      render: (val, r) => (
        <Text style={{ color: r.type === 'withdraw' ? 'red' : 'green' }}>
            {r.type === 'withdraw' ? '-' : '+'}{val?.toLocaleString()}
        </Text>
      )
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
    }
  ];

  if (!wallet) return null;

  return (
    <Drawer
      title={`Ví: ${wallet.store_name}`}
      width={900}
      placement="right"
      onClose={onClose}
      open={visible}
      bodyStyle={{ padding: 20, background: "#f5f7fa" }}
    >
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card bordered={false}>
            <Statistic
              title="Số dư thực tế (Đã duyệt)"
              value={wallet.balance} // Đây là số cũ, sẽ cập nhật khi onSuccess trigger reload
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarSign size={20} />}
              suffix="VND"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false}>
            <Statistic
              title="Doanh thu chờ duyệt (Từ các đơn bên dưới)"
              // Tính tổng pending dựa trên danh sách đơn load về -> Chính xác hơn
              value={pendingOrders.reduce((sum, item) => sum + item.net_income, 0)}
              precision={0}
              valueStyle={{ color: '#faad14' }}
              prefix={<Clock size={20} />}
              suffix="VND"
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        {loading ? <Skeleton active /> : (
          <Tabs items={[
            {
              key: 'pending',
              label: `Đơn hàng chờ duyệt (${pendingOrders.length})`,
              children: <Table dataSource={pendingOrders} columns={pendingColumns} rowKey="id" pagination={{pageSize: 5}} size="small" />
            },
            {
              key: 'history',
              label: 'Lịch sử giao dịch',
              children: <Table dataSource={transactions} columns={historyColumns} rowKey="id" pagination={{pageSize: 10}} size="small" />
            }
          ]} />
        )}
      </Card>
    </Drawer>
  );
};

export default WalletDetailModal;