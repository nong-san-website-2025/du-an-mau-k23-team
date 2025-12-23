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
  // Logic responsive từ nhánh ChiTham1
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;
  
  const columns = [
    {
      title: (<span style={{ whiteSpace: 'nowrap' }}>Thông tin Voucher</span>),
      dataIndex: "code",
      key: "info",
      width: isMobile ? 240 : 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong copyable style={{ color: '#1677ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.code}</Text>
          <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.name || record.title}</Text>
        </Space>
      ),
    },
    {
      title: (<span style={{ whiteSpace: 'nowrap' }}>Loại</span>),
      key: "voucher_type",
      width: isMobile ? 140 : 180,
      align: "center",
      render: (_, record) => {
        const isFreeship = 
            record.voucher_type === 'freeship' || 
            (record.freeship_amount && record.freeship_amount > 0) ||
            record.discount_type === 'freeship';
        
        if (isFreeship) {
            return <Tag color="purple"><span style={{ whiteSpace: 'nowrap' }}>Miễn phí vận chuyển</span></Tag>;
        }
        return <Tag color="blue"><span style={{ whiteSpace: 'nowrap' }}>Voucher thường</span></Tag>;
      },
    },
    {
      title: (<span style={{ whiteSpace: 'nowrap' }}>Thời gian áp dụng</span>),
      key: "time",
      width: isMobile ? 200 : 220,
      render: (_, record) => {
        // [MERGE] Kết hợp logic lấy dữ liệu của HEAD và giao diện của ChiTham1
        const start = record.start_at || record.start;
        const end = record.end_at || record.end;

        return (
          <div style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
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
      title: (<span style={{ whiteSpace: 'nowrap' }}>Trạng thái</span>),
      dataIndex: "active",
      key: "active",
      width: isMobile ? 100 : 100,
      align: "center",
      render: (active) => (
        active 
        ? <Tag color="success"><span style={{ whiteSpace: 'nowrap' }}>Đang chạy</span></Tag> 
        : <Tag color="default"><span style={{ whiteSpace: 'nowrap' }}>Tạm dừng</span></Tag>
      ),
    },
    {
      title: (<span style={{ whiteSpace: 'nowrap' }}>Sử dụng</span>),
      key: "usage",
      align: "center",
      width: isMobile ? 110 : 120,
      render: (_, record) => {
          const used = record.used_quantity || record.issued_count || 0;
          const total = record.total_quantity;
          
          if (total === null || total === undefined) {
              return (
                  <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 'bold' }}>{used}</div>
                      <div style={{ borderTop: '1px solid #eee', fontSize: 11, color: '#888', marginTop: 2 }}>KGH</div>
                  </div>
              );
          }
          return <span style={{ whiteSpace: 'nowrap' }}>{used} / {total}</span>;
      }
    },
    {
      title: (<span style={{ whiteSpace: 'nowrap' }}>Hành động</span>),
      key: "actions",
      align: "right",
      width: isMobile ? 100 : 130,
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
      // [MERGE] Giữ lại tính năng chọn dòng từ HEAD
      rowSelection={rowSelection ? {
          type: 'checkbox',
          ...rowSelection,
      } : undefined}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      size={isMobile ? 'small' : 'middle'}
      tableLayout="fixed"
      scroll={{ x: isMobile ? 900 : 1000 }}
    />
  );
}