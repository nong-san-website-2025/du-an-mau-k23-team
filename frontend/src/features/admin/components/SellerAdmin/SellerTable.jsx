import React, { useState, useEffect } from "react";
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
  data = [],
  loading = false,
  onApprove,
  onReject,
  onView,
  onLock,
  onRow,
  // Thao tác hàng loạt
  onBulkApprove,
  onBulkReject,
  onBulkLock,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // --- 1. LOGIC REAL-TIME: Đồng bộ hóa Selection ---
  // Khi dữ liệu thay đổi từ WebSocket (ví dụ: một Admin khác xóa hoặc thay đổi trạng thái khiến dòng biến mất),
  // Effect này sẽ lọc bỏ các ID không còn tồn tại trong danh sách "Đã chọn".
  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const currentIds = data.map((item) => item.id);
      setSelectedRowKeys((prevKeys) =>
        prevKeys.filter((key) => currentIds.includes(key))
      );
    }
  }, [data]);

  // --- XỬ LÝ CHỌN DÒNG ---
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  // --- WRAPPERS CHO BULK ACTIONS (Xóa selection sau khi thực hiện) ---
  const handleBulkApprove = () => {
    onBulkApprove?.(selectedRowKeys);
    setSelectedRowKeys([]);
  };

  const handleBulkReject = () => {
    onBulkReject?.(selectedRowKeys);
    setSelectedRowKeys([]);
  };

  const handleBulkLock = () => {
    onBulkLock?.(selectedRowKeys);
    setSelectedRowKeys([]);
  };

  // --- ĐỊNH NGHĨA CỘT ---
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      align: "center",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 250,
      sorter: (a, b) => (a.store_name || "").localeCompare(b.store_name || ""),
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Email",
      dataIndex: "user_email",
      key: "user_email",
      width: 220,
      sorter: (a, b) => (a.user_email || "").localeCompare(b.user_email || ""),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      align: "center",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (status) => <SellerStatusTag status={status} />,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      align: "center",
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 110,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        const actions = [
          {
            icon: <EyeOutlined />,
            actionType: "view",
            tooltip: "Chi tiết",
            show: true,
            onClick: () => onView?.(record),
          },
          {
            icon: <CheckOutlined />,
            actionType: "approve",
            tooltip: "Duyệt",
            show: record.status === "pending",
            onClick: () => onApprove?.(record),
            confirm: { title: "Duyệt cửa hàng này?" },
          },
          {
            icon: <CloseOutlined />,
            actionType: "reject",
            tooltip: "Từ chối",
            show: record.status === "pending",
            onClick: () => onReject?.(record),
            confirm: { title: "Từ chối cửa hàng này?" },
          },
          {
            icon: <LockOutlined />,
            actionType: "lock",
            tooltip: "Khóa",
            show: record.status === "active",
            onClick: () => onLock?.(record),
            confirm: { title: "Khóa cửa hàng này?" },
          },
          {
            icon: <UnlockOutlined />,
            actionType: "unlock",
            tooltip: "Mở khóa",
            show: ["locked", "banned"].includes(record.status),
            onClick: () => onLock?.(record),
            confirm: { title: "Mở khóa cửa hàng này?" },
          },
        ];
        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <div className="seller-table-container">
      {/* THANH CÔNG CỤ THAO TÁC HÀNG LOẠT */}
      <div
        style={{
          marginBottom: 16,
          minHeight: 40,
          display: "flex",
          alignItems: "center",
        }}
      >
        {hasSelected ? (
          <Space>
            <span style={{ marginRight: 8 }}>
              Đã chọn <b>{selectedRowKeys.length}</b> mục
            </span>

            {onBulkApprove && (
              <Popconfirm
                title="Duyệt các mục đã chọn?"
                onConfirm={handleBulkApprove}
              >
                <Button
                  type="primary"
                  style={{ backgroundColor: "#52c41a", border: "none" }}
                  icon={<CheckOutlined />}
                >
                  Duyệt
                </Button>
              </Popconfirm>
            )}

            {onBulkReject && (
              <Popconfirm
                title="Từ chối các mục đã chọn?"
                onConfirm={handleBulkReject}
              >
                <Button type="primary" danger icon={<CloseOutlined />}>
                  Từ chối
                </Button>
              </Popconfirm>
            )}

            {onBulkLock && (
              <Popconfirm
                title="Thay đổi trạng thái Khóa/Mở khóa?"
                onConfirm={handleBulkLock}
              >
                <Button icon={<LockOutlined />} danger>
                  Khóa / Mở khóa
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
          <span style={{ color: "#bfbfbf", fontSize: 13 }}>
            * Chọn các cửa hàng để thực hiện thao tác hàng loạt
          </span>
        )}
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} cửa hàng`,
        }}
        scroll={{ x: 1200 }}
        size="middle"
        onRow={onRow}
        // 2. LOGIC REAL-TIME: Highlight dòng mới (khi backend gửi flag isNew)
        rowClassName={(record) => (record.isNew ? "realtime-new-row" : "")}
      />
    </div>
  );
};

export default SellerTable;
