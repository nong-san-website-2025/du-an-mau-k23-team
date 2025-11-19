import React from "react";
import { Table, Tag, Button, Popconfirm, Space } from "antd";
import dayjs from "dayjs";

// Ant Design table for Orders - Optimized color scheme for admin interface
export default function OrderTableAntd({
  orders,
  loading,
  getStatusLabel,
  formatCurrency,
  formatDate,
  onViewDetail,
  onCancel,
  onRow,
}) {
  // Chỉ dùng màu cho status - quan trọng nhất
  const statusColors = {
    pending: "orange",
    processing: "blue",
    shipping: "geekblue",
    delivered: "green",
    success: "green",
    cancelled: "red",
    refunded: "default",
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 100,
      align: "center",
      sorter: (a, b) => a.id - b.id,
      render: (id) => (
        <span style={{ 
          fontWeight: 600,
          color: '#111827'
        }}>
          #{id}
        </span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 150,
      align: "left",
      sorter: (a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''),
      render: (name) => (
        <div style={{ 
          fontWeight: 500, 
          color: '#111827' 
        }}>
          {name || "Khách vãng lai"}
        </div>
      ),
    },
    {
      title: "Sản phẩm",
      key: "items_count",
      width: 120,
      align: "center",
      render: (_, record) => {
        const count = record.items?.length || 0;
        return (
          <span style={{ 
            color: '#6b7280',
            fontSize: '13px'
          }}>
            {count} sản phẩm
          </span>
        );
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 140,
      align: "right",
      sorter: (a, b) => (a.total_price || 0) - (b.total_price || 0),
      render: (value) => (
        <div style={{ 
          fontWeight: 700,
          fontSize: '14px',
          color: '#111827',
          textAlign: 'right'
        }}>
          {value != null ? formatCurrency(value) : "—"}
        </div>
      ),
    },
    {
      title: "Phí sàn",
      key: "platform_commission",
      width: 120,
      align: "right",
      render: (_, record) => {
        const total = (record.items || []).reduce((sum, item) => {
          const itemAmount = (item.price || 0) * (item.quantity || 0);
          return sum + itemAmount * (item.commission_rate || 0);
        }, 0);
        
        return (
          <div style={{ 
            color: "#9ca3af",
            fontWeight: 500,
            fontSize: '13px',
            textAlign: 'right'
          }}>
            {formatCurrency(total)}
          </div>
        );
      },
    },
    {
      title: "Doanh thu",
      key: "seller_amount",
      width: 120,
      align: "right",
      render: (_, record) => {
        const total = (record.items || []).reduce((sum, item) => {
          const itemAmount = (item.price || 0) * (item.quantity || 0);
          const commission = itemAmount * (item.commission_rate || 0);
          return sum + (itemAmount - commission);
        }, 0);
        
        return (
          <div style={{ 
            color: "#111827",
            fontWeight: 600,
            fontSize: '14px',
            textAlign: 'right'
          }}>
            {formatCurrency(total)}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      align: "center",
      filters: Object.keys(statusColors).map(status => ({
        text: getStatusLabel(status),
        value: status,
      })),
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag 
          color={statusColors[status] || "default"}
          style={{ 
            fontWeight: 500,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: 0
          }}
        >
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      align: "center",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280' 
        }}>
          {date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"}
        </div>
      ),
    },
  
  ];

  return (
    <Table
      columns={columns}
      dataSource={orders}
      rowKey="id"
      bordered
      loading={loading}
      pagination={{ 
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `Tổng ${total} đơn hàng`,
        pageSizeOptions: ['10', '20', '50', '100']
      }}
      size="middle"
      onRow={onRow}
      scroll={{ x: 1400 }}
      rowClassName={(record) => {
        // Subtle highlighting cho pending orders
        return record.status === 'pending' ? 'row-pending' : '';
      }}
      style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
}