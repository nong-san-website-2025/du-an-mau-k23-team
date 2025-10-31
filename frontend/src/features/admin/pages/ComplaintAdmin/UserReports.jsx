// src/pages/Admin/Complaint/UserReports.jsx (hoặc đường dẫn tương ứng)
import React, { useState, useEffect } from "react";
import { Table, message, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import ComplaintToolbar from "../../components/ComplaintAdmin/ComplaintToolbar";
import ComplaintDetailModal from "../../components/ComplaintAdmin/ComplaintDetailModal";
import ComplaintResolveModal from "../../components/ComplaintAdmin/ComplaintResolveModal";
import AdminPageLayout from "../../components/AdminPageLayout"; // ✅ Import layout

const API_URL = "http://localhost:8000/api/complaints/";

const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);

  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveComplaint, setResolveComplaint] = useState(null);

  const refreshReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
      else if (data && Array.isArray(data.results)) setReports(data.results);
      else setReports([]);
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu!");
      setReports([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshReports();
  }, []);

  const columns = [
    { title: "Người dùng", dataIndex: "user_name" },
    { title: "Sản phẩm", dataIndex: "product_name" },
    {
      title: "Đơn giá (khi mua)",
      key: "unit_price",
      render: (_, record) => {
        const unit = record.unit_price ?? record.product_price;
        return unit ? Number(unit).toLocaleString("vi-VN") + " VNĐ" : "—";
      },
    },
    { title: "Số lượng", dataIndex: "quantity", render: (qty) => qty ?? 1 },
    { title: "Lý do báo cáo", dataIndex: "reason" },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      render: (date) => (date ? new Date(date).toLocaleString() : ""),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        const color =
          status === "pending"
            ? "orange"
            : status === "resolved"
            ? "green"
            : "red";
        return <span style={{ color }}>{status}</span>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <ComplaintToolbar
          record={record}
          onViewDetail={() => {
            setDetailComplaint(record);
            setDetailModalVisible(true);
          }}
          onOpenResolve={() => {
            setResolveComplaint(record);
            setResolveModalVisible(true);
          }}
          refreshReports={refreshReports}
        />
      ),
    },
  ];

  // ✅ Nút refresh (hoặc có thể để trống nếu không cần extra)
  const extra = (
    <Button
      icon={<ReloadOutlined />}
      onClick={refreshReports}
      loading={loading}
    >
      Tải lại
    </Button>
  );

  return (
    <AdminPageLayout title="NGƯỜI DÙNG KHIẾU NẠI" extra={extra}>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={reports}
        loading={loading}
        bordered
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
      />

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