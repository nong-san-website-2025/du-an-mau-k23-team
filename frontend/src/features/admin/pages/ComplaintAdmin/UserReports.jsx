import React, { useState, useEffect } from "react";
import { Table, message, Button, Card, Tooltip, Popconfirm, Space } from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UndoOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";

import ComplaintDetailModal from "../../components/ComplaintAdmin/ComplaintDetailModal";
import ComplaintResolveModal from "../../components/ComplaintAdmin/ComplaintResolveModal";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatusTag from "../../../../components/StatusTag";
import ButtonAction from "../../../../components/ButtonAction";

const UserReports = () => {
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 480px)").matches;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedDeleteKeys, setSelectedDeleteKeys] = useState([]);
  const [selectedResolveKeys, setSelectedResolveKeys] = useState([]);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveComplaint, setResolveComplaint] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const refreshReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/complaints/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      let listData = Array.isArray(data) ? data : data.results || [];

      listData = listData.map((item) => ({
        ...item,
        seller_name: item.seller_name || "Không xác định",
      }));

      setReports(listData);
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu!");
    }
    setLoading(false);
    setSelectedDeleteKeys([]);
    setSelectedResolveKeys([]);
  };

  useEffect(() => {
    refreshReports();
  }, []);

  const handleReject = async (record) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/complaints/${record.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (res.ok) {
        message.success("Đã từ chối khiếu nại!");
        refreshReports();
      } else {
        message.error("Có lỗi xảy ra khi từ chối.");
      }
    } catch (err) {
      message.error("Lỗi kết nối!");
    }
  };

  const handleResetPending = async (record) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/complaints/${record.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "pending" }),
      });

      if (res.ok) {
        message.success("Đã chuyển về chờ xử lý!");
        refreshReports();
      } else {
        message.error("Không thể reset trạng thái.");
      }
    } catch (err) {
      message.error("Lỗi kết nối!");
    }
  };

  const handleDeleteBatch = async () => {
    const safeDeleteKeys = selectedDeleteKeys.filter((id) => {
      const item = reports.find((r) => r.id === id);
      return item && item.status !== "pending";
    });

    if (safeDeleteKeys.length === 0) {
      message.warning("Không có mục nào hợp lệ để xóa.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    for (const id of safeDeleteKeys) {
      try {
        await fetch(`${API_URL}/complaints/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {}
    }

    setLoading(false);
    message.success("Đã xử lý xóa hàng loạt.");
    refreshReports();
  };

  const handleResolveBatch = async () => {
    if (selectedResolveKeys.length === 0) return;
    setLoading(true);
    const token = localStorage.getItem("token");

    for (const id of selectedResolveKeys) {
      try {
        await fetch(`${API_URL}/complaints/${id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "resolved" }),
        });
      } catch (err) {}
    }

    setLoading(false);
    message.success("Đã xử lý duyệt hàng loạt.");
    refreshReports();
  };

  const rowSelection = {
    selectedRowKeys: [...selectedDeleteKeys, ...selectedResolveKeys],
    onChange: (newSelectedRowKeys, selectedRows) => {
      const deleteKeys = selectedRows
        .filter((row) => row.status !== "pending")
        .map((row) => row.id);
      const resolveKeys = selectedRows
        .filter((row) => row.status === "pending")
        .map((row) => row.id);
      setSelectedDeleteKeys(deleteKeys);
      setSelectedResolveKeys(resolveKeys);
    },
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: isMobile ? 50 : 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Người dùng",
      dataIndex: "complainant_name",
      ellipsis: true,
      sorter: (a, b) =>
        (a.complainant_name || "").localeCompare(b.complainant_name || ""),
      render: (text) => (
        <b style={{ whiteSpace: "nowrap" }}>{text || "Không xác định"}</b>
      ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      ellipsis: true,
      sorter: (a, b) =>
        (a.product_name || "").localeCompare(b.product_name || ""),
      render: (name) => (
        <Tooltip title={name}>
          <span
            style={{
              display: "inline-block",
              maxWidth: isMobile ? 190 : "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Giá trị",
      key: "value",
      width: isMobile ? 120 : 150,
      sorter: (a, b) => {
        const valA =
          Number(a.unit_price ?? a.product_price ?? 0) * (a.quantity ?? 1);
        const valB =
          Number(b.unit_price ?? b.product_price ?? 0) * (b.quantity ?? 1);
        return valA - valB;
      },
      render: (_, record) => {
        const unit = Number(record.unit_price ?? record.product_price ?? 0);
        const qty = record.quantity ?? 1;
        return (
          <span style={{ whiteSpace: "nowrap" }}>
            {unit.toLocaleString("vi-VN")} đ <br />
            <small style={{ color: "#888" }}>x{qty}</small>
          </span>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      width: isMobile ? 130 : 160,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : ""),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: isMobile ? 120 : 140,
      align: "center",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Hành động",
      key: "action",
      width: isMobile ? 100 : 140,
      align: isMobile ? "center" : "right",
      render: (_, record) => {
        const actions = [
          {
            actionType: "view",
            icon: <EyeOutlined />,
            tooltip: "Xem chi tiết",
            onClick: () => {
              setDetailComplaint(record);
              setDetailModalVisible(true);
            },
          },
          {
            actionType: "approve",
            icon: <CheckCircleOutlined />,
            tooltip: "Giải quyết",
            show: record.status === "pending",
            onClick: () => {
              setResolveComplaint(record);
              setResolveModalVisible(true);
            },
          },
          {
            actionType: "reject",
            icon: <CloseCircleOutlined />,
            tooltip: "Từ chối",
            show: record.status === "pending",
            confirm: { title: "Từ chối khiếu nại này?" },
            onClick: (r) => handleReject(r),
          },
          {
            actionType: "edit",
            icon: <UndoOutlined />,
            tooltip: "Reset",
            show: record.status !== "pending",
            confirm: { title: "Xử lý lại?" },
            onClick: (r) => handleResetPending(r),
          },
        ];
        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <AdminPageLayout
      title="QUẢN LÝ KHIẾU NẠI NGƯỜI DÙNG"
      extra={
        <Space wrap>
          {selectedResolveKeys.length > 0 && (
            <Popconfirm
              title={`Duyệt ${selectedResolveKeys.length} khiếu nại?`}
              onConfirm={handleResolveBatch}
            >
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Duyệt Nhanh ({selectedResolveKeys.length})
              </Button>
            </Popconfirm>
          )}
          {selectedDeleteKeys.length > 0 && (
            <Popconfirm
              title={`Xóa ${selectedDeleteKeys.length} đơn?`}
              onConfirm={handleDeleteBatch}
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                loading={loading}
              >
                Xóa ({selectedDeleteKeys.length})
              </Button>
            </Popconfirm>
          )}
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={refreshReports}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>
      }
    >
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }}
          size={isMobile ? "small" : "middle"}
          scroll={{ x: 1000 }}
        />
      </Card>
      <ComplaintDetailModal
        visible={detailModalVisible}
        complaint={detailComplaint}
        onClose={() => setDetailModalVisible(false)}
      />
      <ComplaintResolveModal
        visible={resolveModalVisible}
        complaint={resolveComplaint}
        onClose={() => setResolveModalVisible(false)}
        refreshReports={refreshReports}
      />
    </AdminPageLayout>
  );
};

export default UserReports;
