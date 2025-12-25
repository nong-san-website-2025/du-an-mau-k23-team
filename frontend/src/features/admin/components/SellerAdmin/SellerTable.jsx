import React from "react";
import { Table, Button, Space, Popconfirm, Tooltip } from "antd";
import {
  EyeOutlined, 
  LockOutlined, 
  UnlockOutlined, 
  CheckOutlined,
  CloseOutlined
} from "@ant-design/icons";
import SellerStatusTag from "../../../../components/StatusTag.jsx";
import dayjs from "dayjs";
import "../../styles/AdminPageLayout.css";

const SellerTable = ({
  data = [],
  loading = false,
  selectedRowKeys = [],
  setSelectedRowKeys,
  onView,
  onLock,         // Dùng cho trang Quản lý (Active/Locked)
  onApprove,
  onReject,
  onRow,
}) => {

  const onSelectChange = (newSelectedRowKeys) => {
    if (setSelectedRowKeys) {
        setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70, align: "center", sorter: (a, b) => a.id - b.id },
    { title: "Tên cửa hàng", dataIndex: "store_name", key: "store_name", width: 250, render: (text) => <b>{text}</b> },
    { title: "Email", dataIndex: "user_email", key: "user_email", width: 220, sorter: (a, b) => (a.user_email || "").localeCompare(b.user_email || "") },
    { title: "Trạng thái", dataIndex: "status", key: "status", width: 130, align: "center", sorter: (a, b) => (a.status || "").localeCompare(b.status || ""), render: (status) => <SellerStatusTag status={status} /> },
    { title: "Ngày đăng ký", dataIndex: "created_at", key: "created_at", width: 160, align: "center", sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(), render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—") },
    {
      title: "Thao tác", key: "action", width: 120, align: "center", fixed: "right",
      render: (_, record) => {
        const isPending = record.status === 'pending';
        const isActive = record.status === 'active';
        
        return (
            <Space size={2} onClick={(e) => e.stopPropagation()}>
                {/* 1. Nút Xem chi tiết (Luôn hiện) */}
                <Tooltip title="Xem chi tiết">
                    <Button type="text" size="small" icon={<EyeOutlined style={{color: '#1890ff'}}/>} onClick={(e) => { e.stopPropagation(); onView?.(record); }} />
                </Tooltip>

                {/* 2. Nhóm nút Duyệt / Từ chối (CHỈ HIỆN KHI PENDING) */}
                {isPending && onApprove && (
                   <Tooltip title="Duyệt nhanh">
                      <Popconfirm title="Duyệt cửa hàng này?" onConfirm={(e) => { e.stopPropagation(); onApprove(record); }} cancelText="Hủy" okText="Duyệt">
                        <Button type="text" size="small" icon={<CheckOutlined style={{color: '#52c41a'}}/>} onClick={(e)=>e.stopPropagation()} />
                      </Popconfirm>
                   </Tooltip>
                )}
                
                {isPending && onReject && (
                   <Tooltip title="Từ chối nhanh">
                      <Button type="text" size="small" icon={<CloseOutlined style={{color: '#ff4d4f'}}/>} onClick={(e) => { e.stopPropagation(); onReject(record); }} />
                   </Tooltip>
                )}

                {/* Đã xóa logic nút Hoàn tác/Chờ duyệt ở đây theo yêu cầu */}
                
                {/* 3. Nút Khóa / Mở khóa (Chỉ hiện ở trang Quản lý - khi có prop onLock) */}
                {onLock && (
                    <Tooltip title={isActive ? "Khóa cửa hàng" : "Mở khóa"}>
                        <Popconfirm
                            title={`Bạn muốn ${isActive ? 'khóa' : 'mở khóa'} cửa hàng này?`}
                            onConfirm={(e) => { e.stopPropagation(); onLock(record); }}
                            onCancel={(e) => e.stopPropagation()}
                            okText="Đồng ý" cancelText="Hủy"
                        >
                            <Button type="text" size="small" icon={isActive ? <LockOutlined style={{color: '#ff4d4f'}}/> : <UnlockOutlined style={{color: '#52c41a'}}/>} onClick={(e) => e.stopPropagation()} />
                        </Popconfirm>
                    </Tooltip>
                )}
            </Space>
        );
      },
    },
  ];

  return (
    <div className="seller-table-container">
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng cộng ${total} cửa hàng` }}
        scroll={{ x: 1000 }}
        size="middle"
        onRow={onRow}
        rowClassName={(record) => (record.isNew ? "realtime-new-row" : "")}
      />
    </div>
  );
};

export default SellerTable;