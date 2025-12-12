import React from "react";
import { Table } from "antd";
import dayjs from "dayjs";
import { Eye, XCircle, Printer } from "lucide-react"; // Dùng Lucide icons cho đẹp và đồng bộ
import ButtonAction from "../../../../components/ButtonAction"; // Giả sử cùng thư mục
import StatusTag from "../../../../components/StatusTag";       // Giả sử cùng thư mục
import { intcomma } from './../../../../utils/format';

export default function OrderTableAntd({
  orders,
  loading,
  getStatusLabel,
  formatCurrency,
  formatDate, // Tuy nhiên ở dưới bạn dùng dayjs trực tiếp, nên mình sẽ giữ logic cũ
  onViewDetail,
  onCancel,
  onRow,
}) {

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 70,
      align: "center",
      sorter: (a, b) => a.id - b.id,
      render: (id) => (
        <span style={{ fontWeight: 700, color: '#374151' }}>#{id}</span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 160,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>
            {name || "Khách vãng lai"}
          </div>
          {record.customer_phone && (
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {record.customer_phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Sản phẩm",
      key: "items_count",
      width: 100,
      align: "center",
      render: (_, record) => (
        <span style={{ color: '#6b7280', fontSize: '13px' }}>
          {record.items?.length || 0} món
        </span>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 100,
      align: "right",
      sorter: (a, b) => (a.total_price || 0) - (b.total_price || 0),
      render: (value) => (
        <div style={{ fontWeight: 700, color: '#111827' }}>
          {value != null ? intcomma(value) : "—"}
        </div>
      ),
    },
    {
      title: "Lợi nhuận sàn", // Đổi tên cột Phí sàn cho chuyên nghiệp hơn
      key: "platform_commission",
      width: 100,
      align: "right",
      render: (_, record) => {
        const total = (record.items || []).reduce((sum, item) => {
          const itemAmount = (item.price || 0) * (item.quantity || 0);
          return sum + itemAmount * (item.commission_rate || 0);
        }, 0);

        return (
          <div style={{ color: "#d97706", fontWeight: 500, fontSize: '13px' }}>
            +{intcomma(total)}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      filters: [
        { text: 'Chờ xử lý', value: 'pending' },
        { text: 'Đang giao', value: 'shipping' },
        { text: 'Hoàn thành', value: 'success' },
        { text: 'Đã hủy', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
      // SỬ DỤNG COMPONENT STATUS TAG
      render: (status) => (
        <StatusTag
          status={status}
          label={getStatusLabel(status)}
        />
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      align: "center",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            {date ? dayjs(date).format("HH:mm") : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác", // Cột mới sử dụng ButtonAction
      key: "action",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        // Định nghĩa các hành động cho từng dòng
        const actions = [
          {
            actionType: "view",
            tooltip: "Xem chi tiết",
            icon: <Eye />, // Lucide Icon
            onClick: () => onViewDetail(record.id),
          },
        ];

        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={orders}
      rowKey="id"
      bordered={true} // Bỏ border dọc nhìn sẽ hiện đại hơn
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} đơn hàng`,
        pageSizeOptions: ['10', '20', '50']
      }}
      size="small"
      onRow={onRow}
      scroll={{ x: 1300 }}
      rowClassName={(record) => {
        // Highlight nhẹ các đơn hàng mới
        return record.status === 'pending' ? 'bg-orange-50' : '';
      }}
      style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' // Thêm bóng nhẹ cho bảng
      }}
    />
  );
}