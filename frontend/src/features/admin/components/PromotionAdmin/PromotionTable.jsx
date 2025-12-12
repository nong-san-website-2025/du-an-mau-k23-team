import React from "react";
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Typography } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

export default function PromotionTable({ data, loading, onView, onEdit, onDelete }) {
  
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
    // [SỬA LẠI] Cột Loại Voucher hiển thị tiếng Việt & Màu sắc chuẩn
    {
      title: "Loại",
      key: "voucher_type",
      width: 180,
      align: "center",
      render: (_, record) => {
        // Logic kiểm tra Freeship: Dựa vào backend trả về hoặc giá trị tiền
        const isFreeship = 
            record.voucher_type === 'freeship' || 
            (record.freeship_amount && record.freeship_amount > 0) ||
            record.discount_type === 'freeship';
        
        if (isFreeship) {
            return <Tag color="purple">Miễn phí vận chuyển</Tag>;
        }
        return <Tag color="blue">Voucher thường</Tag>;
      },
    },
    {
      title: "Thời gian áp dụng",
      key: "time",
      width: 220,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4 }}>
             <span style={{ color: '#888' }}>BĐ:</span> {record.start ? dayjs(record.start).format("DD/MM/YYYY HH:mm") : "--"}
          </div>
          <div>
             <span style={{ color: '#888' }}>KT:</span> {record.end ? dayjs(record.end).format("DD/MM/YYYY HH:mm") : "--"}
          </div>
        </div>
      ),
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
    // [SỬA LẠI] Cột Sử dụng: Xử lý null thành "KGH" (Không giới hạn)
    {
      title: "Sử dụng",
      key: "usage",
      align: "center",
      width: 120,
      render: (_, record) => {
          const used = record.issued_count || 0;
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
      pagination={{ pageSize: 10, showSizeChanger: true }}
      scroll={{ x: 1000 }}
    />
  );
}