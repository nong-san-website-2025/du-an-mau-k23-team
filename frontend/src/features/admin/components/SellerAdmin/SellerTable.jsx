import React, { useState } from "react";
import { Table, Button, Space, Popconfirm } from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import SellerStatusTag from "../../../../components/StatusTag.jsx";
import dayjs from "dayjs";
import "../../styles/AdminPageLayout.css";
import ButtonAction from "../../../../components/ButtonAction";

const SellerTable = ({
  data,
  onApprove,
  onReject,
  onView,
  onLock,
  onRow,
  // Các props cho thao tác hàng loạt (Optional)
  onBulkApprove,
  onBulkReject,
  onBulkLock,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Cấu hình chọn dòng
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  // --- CÁC HÀM XỬ LÝ WRAPPER ---
  const handleBulkApprove = () => {
    if (onBulkApprove) {
      onBulkApprove(selectedRowKeys);
      setSelectedRowKeys([]); // Reset sau khi bấm
    }
  };

  const handleBulkReject = () => {
    if (onBulkReject) {
      onBulkReject(selectedRowKeys);
      setSelectedRowKeys([]);
    }
  };

  const handleBulkLock = () => {
    if (onBulkLock) {
      onBulkLock(selectedRowKeys);
      setSelectedRowKeys([]);
    }
  };

  // --- COLUMNS (Giữ nguyên logic cũ của bạn) ---
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60, align: "center" },
    {
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 250,
    },
    {
      title: "Mô tả cửa hàng",
      dataIndex: "store_description",
      key: "store_description",
      width: 300,
      ellipsis: true, // Tự động cắt ngắn văn bản dài và hiển thị dấu "..."
    },
    {
      title: "Người đăng ký",
      dataIndex: "owner_username",
      key: "owner_username",
      width: 150,
    },
    { title: "Email", dataIndex: "user_email", key: "user_email", width: 220 },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => <SellerStatusTag status={status} />,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        // Logic nút đơn lẻ (giữ nguyên)
        const actions = [
          {
            icon: <EyeOutlined />,
            actionType: "view",
            tooltip: "Chi tiết",
            show: true,
            onClick: onView,
          },
          {
            icon: <CheckOutlined />,
            actionType: "approve",
            tooltip: "Duyệt",
            show: record.status === "pending",
            onClick: onApprove,
            confirm: { title: "Duyệt?" },
          },
          {
            icon: <CloseOutlined />,
            actionType: "reject",
            tooltip: "Từ chối",
            show: record.status === "pending",
            onClick: onReject,
            confirm: { title: "Từ chối?" },
          },
          {
            icon: <LockOutlined />,
            actionType: "lock",
            tooltip: "Khóa",
            show: record.status === "active",
            onClick: onLock,
            confirm: { title: "Khóa?" },
          },
          {
            icon: <UnlockOutlined />,
            actionType: "unlock",
            tooltip: "Mở khóa",
            show: record.status === "locked" || record.status === "banned",
            onClick: onLock,
            confirm: { title: "Mở khóa?" },
          },
        ];
        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <div>
      {/* THANH CÔNG CỤ BULK ACTION */}
      <div
        style={{
          marginBottom: 16,
          minHeight: 32,
          display: "flex",
          alignItems: "center",
        }}
      >
        {hasSelected ? (
          <Space>
            <span style={{ marginRight: 8 }}>
              Đã chọn <b>{selectedRowKeys.length}</b> cửa hàng
            </span>

            {/* Chỉ hiện nút DUYỆT nếu component cha truyền hàm onBulkApprove */}
            {onBulkApprove && (
              <Popconfirm
                title="Duyệt các mục đã chọn?"
                onConfirm={handleBulkApprove}
              >
                <Button
                  type="primary"
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                  icon={<CheckOutlined />}
                >
                  Duyệt ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}

            {/* Chỉ hiện nút TỪ CHỐI nếu component cha truyền hàm onBulkReject */}
            {onBulkReject && (
              <Popconfirm
                title="Từ chối các mục đã chọn?"
                onConfirm={handleBulkReject}
              >
                <Button type="primary" danger icon={<CloseOutlined />}>
                  Từ chối ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}

            {/* Chỉ hiện nút KHÓA/MỞ KHÓA nếu component cha truyền hàm onBulkLock */}
            {onBulkLock && (
              <Popconfirm
                title="Thực hiện Khóa / Mở khóa các mục đã chọn?"
                onConfirm={handleBulkLock}
              >
                <Button type="default" danger icon={<LockOutlined />}>
                  Khóa / Mở khóa ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}

            <Button
              onClick={() => setSelectedRowKeys([])}
              icon={<ReloadOutlined />}
            >
              Bỏ chọn
            </Button>
          </Space>
        ) : (
          <span style={{ color: "#999", fontStyle: "italic" }}>
            {/* Tích chọn vào ô bên trái để thao tác nhiều dòng */}
          </span>
        )}
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        scroll={{ x: 1500 }} // Tăng chiều rộng cuộn để có không gian cho cột mới
        size="small"
        onRow={onRow}
      />
    </div>
  );
};

export default SellerTable;
