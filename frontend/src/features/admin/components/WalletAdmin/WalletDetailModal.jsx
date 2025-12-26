import React, { useEffect, useState } from "react";
import {
  Drawer,
  Table,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
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
  ArrowDownCircle,
} from "lucide-react";
import { CheckCircleFilled } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { intcomma } from './../../../../utils/format';

const { Text } = Typography;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const WalletDetailModal = ({ visible, onClose, wallet, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => {
    if (wallet?.seller_id && visible) {
      fetchDetailData();
      setSelectedRowKeys([]); 
    }
  }, [wallet, visible]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const sellerId = wallet.seller_id;
      const [transRes, pendingRes] = await Promise.all([
        api.get(`payments/wallets/${sellerId}/transactions/`, { headers: getAuthHeaders() }),
        api.get(`payments/wallets/${sellerId}/pending-orders/`, { headers: getAuthHeaders() })
      ]);
      setTransactions(transRes.data?.transactions || []);
      setPendingOrders(pendingRes.data?.pending_orders || []);
    } catch (err) {
      message.error("Không tải được chi tiết ví");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý duyệt 1 đơn
  const handleApproveOrder = async (orderId) => {
    setApprovingId(orderId);
    try {
      await api.post(`payments/wallets/approve-order/${orderId}/`, {}, { headers: getAuthHeaders() });
      message.success(`Đã duyệt đơn hàng #${orderId}`);
      setSelectedRowKeys(prev => prev.filter(key => key !== orderId));
      await fetchDetailData();
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(`Lỗi đơn #${orderId}: ` + (err.response?.data?.error || "Không thể duyệt"));
    } finally {
      setApprovingId(null);
    }
  };

  // SỬA LỖI TẠI ĐÂY: Duyệt hàng loạt theo thứ tự để tránh lỗi DB
  const handleBatchApprove = async () => {
    if (selectedRowKeys.length === 0) return;
    setBatchLoading(true);
    let successCount = 0;

    try {
      // Dùng for...of để đợi từng request hoàn tất trước khi sang cái tiếp theo
      for (const id of selectedRowKeys) {
        try {
          await api.post(`payments/wallets/approve-order/${id}/`, {}, { headers: getAuthHeaders() });
          successCount++;
          // Cập nhật UI: bỏ chọn đơn đã duyệt xong
          setSelectedRowKeys(prev => prev.filter(key => key !== id));
        } catch (singleErr) {
          console.error(`Lỗi duyệt đơn ${id}:`, singleErr);
        }
      }

      message.success(`Đã duyệt thành công ${successCount}/${selectedRowKeys.length} đơn hàng!`);
      setSelectedRowKeys([]); // Reset hoàn toàn sau khi xong
      await fetchDetailData();
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error("Có lỗi xảy ra trong quá trình duyệt hàng loạt");
    } finally {
      setBatchLoading(false);
    }
  };

  const pendingColumns = [
    { title: "Mã Đơn", dataIndex: "id", key: "id", render: (text) => <Text strong>#{text}</Text> },
    { title: "Ngày tạo", dataIndex: "created_at", render: (date) => dayjs(date).format("DD/MM/YYYY") },
    { title: "Tổng đơn", dataIndex: "total_order_value", align: "right", render: (val) => val?.toLocaleString() + " đ" },
    {
      title: "Phí sàn",
      key: "commission",
      align: "right",
      render: (_, record) => {
        // Phí sàn = Tổng đơn - Thực nhận (net_income)
        const commission = (record.total_order_value || 0) - (record.net_income || 0);
        return <Text>{intcomma(commission)} đ</Text>;
      }
    },
    { title: "Thực nhận", dataIndex: "net_income", align: "right", render: (val) => <Text strong>{intcomma(val)} đ</Text> },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Popconfirm title="Xác nhận duyệt?" onConfirm={() => handleApproveOrder(record.id)}>
          <Button 
            type="primary" size="small" icon={<CheckCircleFilled />} 
            loading={approvingId === record.id}
            disabled={batchLoading}
          > Duyệt </Button>
        </Popconfirm>
      ),
    },
  ];

  const historyColumns = [
    { title: "Ngày", dataIndex: "created_at", render: (d) => dayjs(d).format("DD/MM HH:mm") },
    {
      title: "Loại",
      dataIndex: "type",
      render: (type) => {
        const typeConfig = {
          'sale_income': { color: 'green', icon: <PlusCircle size={14}/>, text: 'Doanh thu' },
          'pending_income': { color: 'orange', icon: <Clock size={14}/>, text: 'Doanh thu chờ' },
          'deposit': { color: 'green', icon: <PlusCircle size={14}/>, text: 'Cộng tiền' },
          'add': { color: 'green', icon: <PlusCircle size={14}/>, text: 'Cộng tiền' },
          'withdraw': { color: 'blue', icon: <ArrowDownCircle size={14}/>, text: 'Rút tiền' },
          'refund_deduct': { color: 'red', icon: <ArrowDownCircle size={14}/>, text: 'Hoàn tiền' },
          'platform_fee': { color: 'orange', icon: <ArrowDownCircle size={14}/>, text: 'Phí sàn' },
        };
        const config = typeConfig[type] || { color: 'default', icon: null, text: type };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      align: "right",
      render: (val, r) => {
        const isNegative = ['withdraw', 'refund_deduct', 'platform_fee'].includes(r.type);
        const color = isNegative ? 'red' : 'green';
        const prefix = isNegative ? '-' : '+';
        return (
          <Text style={{ color, fontWeight: 500 }}>
            {prefix}{Math.abs(val)?.toLocaleString()}đ
          </Text>
        );
      }
    },
    { title: "Ghi chú", dataIndex: "note" }
  ];

  return (
    <Drawer
      title={`Ví: ${wallet?.store_name}`}
      width={900}
      onClose={onClose}
      open={visible}
      bodyStyle={{ padding: 20, background: "#f5f7fa" }}
    >
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card bordered={false}>
            <Statistic title="Số dư thực tế" value={wallet?.balance} precision={0} valueStyle={{ color: '#3f8600' }} prefix={<DollarSign size={20} />} suffix="VND" />
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false}>
            <Statistic title="Doanh thu chờ duyệt" value={pendingOrders.reduce((sum, item) => sum + item.net_income, 0)} precision={0} valueStyle={{ color: '#faad14' }} prefix={<Clock size={20} />} suffix="VND" />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        {loading ? <Skeleton active /> : (
          <Tabs items={[
            {
              key: 'pending',
              label: `Đơn hàng chờ duyệt (${pendingOrders.length})`,
              children: (
                <>
                  {/* THANH DUYỆT TẤT CẢ: Sẽ biến mất nếu selectedRowKeys trống hoặc sau khi duyệt xong */}
                  {selectedRowKeys.length > 0 && pendingOrders.length > 0 && (
                    <div style={{ 
                        marginBottom: 16, background: '#e6f7ff', padding: '10px 16px', borderRadius: 6, 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #91d5ff'
                    }}>
                        <Text>Đã chọn <Text strong>{selectedRowKeys.length}</Text> đơn hàng</Text>
                        <Popconfirm
                            title="Xác nhận duyệt hàng loạt?"
                            onConfirm={handleBatchApprove}
                            okText="Đồng ý" cancelText="Hủy"
                        >
                            <Button type="primary" loading={batchLoading} icon={<CheckCircleFilled />}>
                                Duyệt tất cả ({selectedRowKeys.length})
                            </Button>
                        </Popconfirm>
                    </div>
                  )}

                  <Table 
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    dataSource={pendingOrders} 
                    columns={pendingColumns} 
                    rowKey="id" 
                    pagination={{ pageSize: 5 }} 
                    size="small" 
                    locale={{ emptyText: 'Không có đơn hàng chờ duyệt' }}
                  />
                </>
              )
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