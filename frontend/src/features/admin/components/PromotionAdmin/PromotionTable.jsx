import React from "react";
import { Table, Tag, Space, Typography } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ButtonAction from "../../../../components/ButtonAction";

const { Text } = Typography;

export default function PromotionTable({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  rowSelection,
}) {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 480px)").matches;

  const columns = [
    {
      title: "Thông tin Voucher",
      dataIndex: "code",
      key: "info",
      width: 250,
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong copyable style={{ color: "#1677ff" }}>
            {record.code}
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {record.name || record.title}
          </Text>
        </Space>
      ),
    },
    {
      title: "Loại",
      key: "voucher_type",
      width: 180,
      align: "center",
      sorter: (a, b) => {
        const typeA =
          a.voucher_type === "freeship" || a.discount_type === "freeship"
            ? 1
            : 0;
        const typeB =
          b.voucher_type === "freeship" || b.discount_type === "freeship"
            ? 1
            : 0;
        return typeA - typeB;
      },
      render: (_, record) => {
        const isFreeship =
          record.voucher_type === "freeship" ||
          record.freeship_amount > 0 ||
          record.discount_type === "freeship";
        return (
          <Tag color={isFreeship ? "purple" : "blue"}>
            {isFreeship ? "Miễn phí vận chuyển" : "Voucher thường"}
          </Tag>
        );
      },
    },
    {
      title: "Thời gian áp dụng",
      key: "time",
      width: 220,
      sorter: (a, b) =>
        dayjs(a.start_at || a.start).unix() -
        dayjs(b.start_at || b.start).unix(),
      render: (_, record) => {
        const start = record.start_at || record.start;
        const end = record.end_at || record.end;
        return (
          <div style={{ fontSize: 12 }}>
            <div>
              <span style={{ color: "#888" }}>BĐ:</span>{" "}
              {start ? dayjs(start).format("DD/MM/YYYY HH:mm") : "--"}
            </div>
            <div>
              <span style={{ color: "#888" }}>KT:</span>{" "}
              {end ? dayjs(end).format("DD/MM/YYYY HH:mm") : "--"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 130,
      align: "right",
      render: (_, record) => (
        <ButtonAction
          actions={[
            {
              actionType: "view",
              icon: <EyeOutlined />,
              tooltip: "Xem",
              onClick: () => onView(record),
            },
            {
              actionType: "edit",
              icon: <EditOutlined />,
              tooltip: "Sửa",
              onClick: () => onEdit(record),
            },
            {
              actionType: "delete",
              icon: <DeleteOutlined />,
              tooltip: "Xóa",
              confirm: { title: "Xóa voucher này?" },
              onClick: () => onDelete(record),
            },
          ]}
          record={record}
        />
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection}
      size={isMobile ? "small" : "middle"}
      scroll={{ x: 800 }}
    />
  );
}
