import React, { useState } from "react";
import { Tag, Typography } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import WalletBaseLayout from "./WalletBaseLayout";

const { Text } = Typography;

export default function WalletTransactions({
  loading,
  transactions,
  onSearch,
  onFilterStatus,
  onDateRangeChange,
}) {
  // Lịch sử giao dịch - Cột bảng
  const transactionColumns = [
    {
      title: "Mã GD",
      dataIndex: "id",
      key: "id",
      width: 120,
    },
    {
      title: "Loại giao dịch",
      dataIndex: "transaction_type",
      key: "transaction_type",
      width: 150,
      render: (type) => {
        const config = {
          deposit: {
            color: "success",
            text: "Nạp tiền",
            icon: <ArrowUpOutlined />,
          },
          withdraw: {
            color: "error",
            text: "Rút tiền",
            icon: <ArrowDownOutlined />,
          },
          payment: {
            color: "error",
            text: "Thanh toán",
            icon: <ArrowDownOutlined />,
          },
          pending: {
            color: "warning",
            text: "Chờ xử lý",
            icon: <HistoryOutlined />,
          },
          refund: {
            color: "warning",
            text: "Hoàn tiền",
            icon: <ArrowUpOutlined />,
          },
          adjustment: {
            color: "default",
            text: "Điều chỉnh",
            icon: <ArrowUpOutlined />,
          },
        };
        const { color, text, icon } = config[type] || {
          color: "default",
          text: type,
        };
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount, record) => {
        const isIncome = ["deposit", "refund", "adjustment"].includes(
          record.transaction_type
        );
        const isExpense = ["payment", "withdraw"].includes(
          record.transaction_type
        );
        const isPending = record.transaction_type === "pending";

        const color = isIncome ? "#52c41a" : isPending ? "#faad14" : "#ff4d4f";
        const prefix = isIncome ? "+" : isPending ? "~" : "-";

        return (
          <Text strong style={{ color }}>
            {prefix}
            {parseFloat(amount).toLocaleString("vi-VN")} ₫
          </Text>
        );
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleString("vi-VN");
      },
    },
  ];

  const transactionData = transactions.map((tx, idx) => ({
    key: tx.id || idx,
    id: tx.id,
    ...tx,
  }));

  return (
    <WalletBaseLayout
      title="Lịch sử giao dịch"
      loading={loading}
      data={transactionData}
      columns={transactionColumns}
      onSearch={onSearch}
      onFilterStatus={onFilterStatus}
      onDateRangeChange={onDateRangeChange}
      onRow={(record) => ({
        // Bạn có thể thêm hành động khi click vào dòng ở đây
      })}
      searchPlaceholder="Tìm kiếm mã giao dịch hoặc mô tả..."
      showDateFilter={true}
      showStatusFilter={true}
    />
  );
}
