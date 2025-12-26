// src/features/admin/components/OrderAdmin/OrderTableAntd.jsx
import React, { useEffect, useState } from "react";
import { Table } from "antd";
import dayjs from "dayjs";
import { Eye } from "lucide-react"; 
import ButtonAction from "../../../../components/ButtonAction"; 
import StatusTag from "../../../../components/StatusTag"; 
import { intcomma } from './../../../../utils/format';

export default function OrderTableAntd({
  orders,
  loading,
  getStatusLabel,
  onViewDetail,
  pagination,
  onRow,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener ? mql.addEventListener("change", handleChange) : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", handleChange) : mql.removeListener(handleChange);
    };
  }, []);

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 80,
      align: "center",
      render: (id) => <span style={{ fontWeight: 700, color: '#374151' }}>#{id}</span>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 180,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#111827' }}>{name || "Khách vãng lai"}</div>
          {record.customer_phone && (
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{record.customer_phone}</div>
          )}
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      align: "right",
      render: (value) => (
        <div style={{ fontWeight: 700, color: '#111827' }}>
          {value != null ? intcomma(value) : "—"}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center",
      // [QUAN TRỌNG] Đã xóa filters và onFilter để tránh xung đột với API
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
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      fixed: isMobile ? undefined : "right",
      render: (_, record) => {
        const actions = [
          {
            actionType: "view",
            tooltip: "Xem chi tiết",
            icon: <Eye />,
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
      bordered
      loading={loading}
      pagination={pagination}
      onRow={onRow}
      size="small"
      scroll={{ x: 1000 }}
      // Bỏ rowClassName pending màu cam nếu muốn giao diện sạch hơn, hoặc giữ lại tùy bạn
      rowClassName={(record) => record.status === 'pending' ? 'bg-orange-50' : ''}
    />
  );
}