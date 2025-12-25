// src/features/admin/components/WalletAdmin/WithdrawRequestsTable.jsx
import React from "react";
import { Table, Button, Tooltip, Space, Tag, Popconfirm } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "../../styles/AdminPageLayout.css";

const WithdrawRequestsTable = ({ data, onApprove, onReject, loading }) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
      align: "center",
    },
    {
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 200,
      sorter: (a, b) => (a.store_name || "").localeCompare(b.store_name || ""),
    },
    {
      title: "Email",
      dataIndex: "seller_email",
      key: "seller_email",
      width: 200,
      sorter: (a, b) => (a.seller_email || "").localeCompare(b.seller_email || ""),
    },
    {
      title: "Số tiền rút",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount) => <b style={{color: '#cf1322'}}>{amount?.toLocaleString()} đ</b>,
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const config = {
          pending: { color: "orange", text: "Chờ duyệt" },
          paid: { color: "green", text: "Đã thanh toán" },
          rejected: { color: "red", text: "Từ chối" },
          approved: { color: "blue", text: "Đã duyệt" },
        }[status] || { color: "default", text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: "Chờ duyệt", value: "pending" },
        { text: "Đã thanh toán", value: "paid" },
        { text: "Từ chối", value: "rejected" },
      ],
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) => (
        <div style={{fontSize: 12}}>
            {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
            <br/>
            <span style={{color: '#8c8c8c'}}>{date ? dayjs(date).format("HH:mm") : ""}</span>
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          {record.status === "pending" && (
            <>
              <Popconfirm
                title="Duyệt yêu cầu?"
                description={`Rút ${record.amount?.toLocaleString()}đ?`}
                onConfirm={() => onApprove(record)}
                okText="Duyệt" cancelText="Hủy"
              >
                <Tooltip title="Duyệt">
                  <Button type="primary" icon={<CheckOutlined />} size="small" loading={loading} />
                </Tooltip>
              </Popconfirm>
              
              <Popconfirm
                title="Từ chối yêu cầu?"
                description="Hành động này sẽ hoàn tiền lại ví seller."
                onConfirm={() => onReject(record)}
                okText="Từ chối" cancelText="Hủy" okButtonProps={{danger: true}}
              >
                <Tooltip title="Từ chối">
                  <Button type="primary" danger icon={<CloseOutlined />} size="small" loading={loading} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      bordered
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1200 }}
      size="middle"
      loading={loading}
    />
  );
};

export default WithdrawRequestsTable;