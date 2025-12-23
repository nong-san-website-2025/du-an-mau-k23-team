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
  // Các props cho thao tác hàng loạt
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

  // --- COLUMNS (Đã thêm thuộc tính sorter) ---
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
      align: "center",
      // Sắp xếp theo số ID
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 250,
      // Sắp xếp theo tên (Tiếng Việt)
      sorter: (a, b) => (a.store_name || "").localeCompare(b.store_name || ""),
    },
    {
      title: "Người đăng ký",
      dataIndex: "owner_username",
      key: "owner_username",
      width: 150,
      // Sắp xếp theo username
      sorter: (a, b) =>
        (a.owner_username || "").localeCompare(b.owner_username || ""),
    },
    {
      title: "Email",
      dataIndex: "user_email",
      key: "user_email",
      width: 220,
      // Sắp xếp theo email
      sorter: (a, b) => (a.user_email || "").localeCompare(b.user_email || ""),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      // Sắp xếp theo trạng thái
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (status) => <SellerStatusTag status={status} />,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      align: "center",
      // Sắp xếp theo thời gian
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => {
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
        size="small"
        onRow={onRow}
      />
    </div>
  );
};

export default SellerTable;
