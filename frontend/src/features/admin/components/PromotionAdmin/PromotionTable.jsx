import React from "react";
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Typography } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

export default function PromotionTable({ 
    data, 
    loading, 
    onView, 
    onEdit, 
    onDelete, 
    rowSelection 
}) {
  
  const columns = [
    {
      title: "Thông tin Voucher",
      dataIndex: "code",
      key: "info",
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong copyable style={{ color: '#1677ff' }}>{record.code}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{record.name || record.title}</Text>
        </Space>
      ),
    },
    {
      title: "Loại",
      key: "voucher_type",
      width: 150,
      align: "center",
      render: (_, record) => {
        const isFreeship = 
            record.voucher_type === 'freeship' || 
            (record.freeship_amount && record.freeship_amount > 0) ||
            record.discount_type === 'freeship';
        
        if (isFreeship) {
            return <Tag color="purple">Freeship</Tag>;
        }
        return <Tag color="blue">Giảm giá</Tag>;
      },
    },
    {
      title: "Thời gian áp dụng",
      key: "time",
      width: 220,
      render: (_, record) => {
        // [FIX] Kiểm tra kỹ tên trường thời gian từ API trả về
        const start = record.start_at || record.start;
        const end = record.end_at || record.end;

        return (
            <div style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 4 }}>
                 <span style={{ color: '#888', marginRight: 4 }}>BĐ:</span> 
                 {start ? dayjs(start).format("DD/MM/YYYY HH:mm") : <span style={{color:'#ccc'}}>--</span>}
              </div>
              <div>
                 <span style={{ color: '#888', marginRight: 4 }}>KT:</span> 
                 {end ? dayjs(end).format("DD/MM/YYYY HH:mm") : <span style={{color:'#ccc'}}>--</span>}
              </div>
            </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      width: 100,
      align: "center",
      render: (active) => (
        active 
        ? <Tag color="success">Đang chạy</Tag> 
        : <Tag color="default">Tạm dừng</Tag>
      ),
    },
    {
      title: "Sử dụng",
      key: "usage",
      align: "center",
      width: 120,
      render: (_, record) => {
          const used = record.used_quantity || record.issued_count || 0;
          const total = record.total_quantity;
          
          if (total === null || total === undefined) {
              return (
                  <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{used}</div>
                      <div style={{ borderTop: '1px solid #eee', fontSize: 11, color: '#888', marginTop: 2 }}>KGH</div>
                  </div>
              );
          }
          return <span>{used} / {total}</span>;
      }
    },
    {
      title: "Hành động",
      key: "actions",
      align: "right",
      width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} size="small" onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button icon={<EditOutlined />} type="text" style={{ color: '#faad14' }} onClick={() => onEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => onDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} type="text" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection ? {
          type: 'checkbox',
          ...rowSelection,
      } : undefined}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      scroll={{ x: 1000 }}
    />
  );
}