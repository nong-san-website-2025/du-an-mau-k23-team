import React from "react";
import { Table } from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import SellerStatusTag from "../../../../components/StatusTag.jsx"; // Giữ nguyên đường dẫn của bạn
import dayjs from "dayjs";
import "../../styles/AdminPageLayout.css"; // Giữ nguyên đường dẫn của bạn
import ButtonAction from "../../../../components/ButtonAction"; // Đảm bảo import đúng đường dẫn file ButtonAction bạn vừa tạo

const SellerTable = ({ data, onApprove, onReject, onView, onLock, onRow }) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
      sorter: (a, b) => a.id - b.id,
      align: "center",
    },
    {
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 250,
      sorter: (a, b) => a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Người đăng ký",
      dataIndex: "owner_username",
      key: "owner_username",
      width: 150,
      sorter: (a, b) =>
        (a.owner_username || "").localeCompare(b.owner_username || ""),
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
      width: 120,
      align: "center",
      render: (status) => <SellerStatusTag status={status} />,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100, // Tăng nhẹ width để đủ chỗ cho các nút
      align: "center",
      fixed: "right",
      render: (_, record) => {
        // Cấu hình các nút hành động tại đây
        const actions = [
          // 1. Nút Xem chi tiết (Luôn hiện)
          {
            icon: <EyeOutlined />,
            actionType: "view",
            tooltip: "Xem chi tiết",
            show: true,
            onClick: onView, // ButtonAction sẽ gọi onView(record)
          },
          // 2. Nút Duyệt (Chỉ hiện khi trạng thái là 'pending')
          {
            icon: <CheckOutlined />,
            actionType: "approve",
            tooltip: "Duyệt cửa hàng",
            show: record.status === "pending", // LƯU Ý: Kiểm tra lại giá trị status trong DB của bạn
            onClick: onApprove,
            confirm: {
              title: "Duyệt cửa hàng",
              description: `Bạn có chắc muốn duyệt cửa hàng "${record.store_name}"?`,
              okText: "Duyệt",
              cancelText: "Hủy",
            },
          },
          // 3. Nút Từ chối (Chỉ hiện khi trạng thái là 'pending')
          {
            icon: <CloseOutlined />,
            actionType: "reject",
            tooltip: "Từ chối đăng ký",
            show: record.status === "pending",
            onClick: onReject,
            confirm: {
              title: "Từ chối đăng ký",
              description: "Bạn có chắc muốn từ chối cửa hàng này?",
              okText: "Từ chối",
              cancelText: "Hủy",
            },
          },
          // 4. Nút Khóa (Hiện khi đang hoạt động)
          {
            icon: <LockOutlined />,
            actionType: "lock",
            tooltip: "Khóa cửa hàng",
            show: record.status === "active", // LƯU Ý: Kiểm tra lại giá trị status active
            onClick: onLock,
            confirm: {
              title: "Khóa cửa hàng",
              description: "Cửa hàng này sẽ bị vô hiệu hóa?",
              okText: "Khóa",
            },
          },
          // 5. Nút Mở khóa (Hiện khi đang bị khóa/banned)
          {
            icon: <UnlockOutlined />,
            actionType: "unlock",
            tooltip: "Mở khóa hoạt động",
            show: record.status === "banned" || record.status === "inactive", // LƯU Ý: Kiểm tra lại giá trị status banned
            onClick: onLock, // Dùng chung hàm onLock hoặc onUnlock tùy logic của bạn
            confirm: {
              title: "Mở khóa",
              description: "Kích hoạt lại cửa hàng này?",
              okText: "Mở khóa",
            },
          },
        ];

        return <ButtonAction actions={actions} record={record} />;
      },
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
      size="small"
      onRow={onRow}
      rowClassName="table-row"
    />
  );
};

export default SellerTable;