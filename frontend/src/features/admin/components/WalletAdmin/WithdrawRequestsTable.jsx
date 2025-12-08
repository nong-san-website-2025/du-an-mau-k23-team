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
      title: "Seller ID",
      dataIndex: "seller_id",
      key: "seller_id",
      width: 100,
      align: "center",
    },
    {
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 200,
      sorter: (a, b) => a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Email",
      dataIndex: "seller_email",
      key: "seller_email",
      width: 200,
    },
    {
      title: "Số tiền rút",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount) => `${amount?.toLocaleString()} VND`,
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending: { color: "orange", text: "Chờ duyệt" },
          paid: { color: "green", text: "Đã thanh toán" },
          rejected: { color: "red", text: "Từ chối" },
          approved: { color: "blue", text: "Đã duyệt" },
        };
        const config = statusConfig[status] || { color: "default", text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: "Chờ duyệt", value: "pending" },
        { text: "Đã thanh toán", value: "paid" },
        { text: "Từ chối", value: "rejected" },
        { text: "Đã duyệt", value: "approved" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
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
                title="Duyệt yêu cầu rút tiền?"
                description={`Rút ${record.amount?.toLocaleString()} VND cho ${record.store_name}?`}
                onConfirm={() => onApprove(record)}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Tooltip title="Duyệt">
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    size="small"
                    loading={loading}
                  />
                </Tooltip>
              </Popconfirm>
              <Popconfirm
                title="Từ chối yêu cầu rút tiền?"
                description={`Từ chối ${record.amount?.toLocaleString()} VND cho ${record.store_name}?`}
                onConfirm={() => onReject(record)}
                okText="Từ chối"
                cancelText="Hủy"
              >
                <Tooltip title="Từ chối">
                  <Button
                    type="primary"
                    danger
                    icon={<CloseOutlined />}
                    size="small"
                    loading={loading}
                  />
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
      scroll={{ x: 1400 }}
      size="small"
      rowClassName="table-row"
      loading={loading}
    />
  );
};

export default WithdrawRequestsTable;
