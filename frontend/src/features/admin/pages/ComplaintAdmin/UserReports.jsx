import React, { useState, useEffect } from "react";
import { Table, message, Button, Card, Tooltip } from "antd";
import { 
  ReloadOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  UndoOutlined 
} from "@ant-design/icons";

// Import Components
import ComplaintDetailModal from "../../components/ComplaintAdmin/ComplaintDetailModal";
import ComplaintResolveModal from "../../components/ComplaintAdmin/ComplaintResolveModal";
import AdminPageLayout from "../../components/AdminPageLayout";
import StatusTag from "../../../../components/StatusTag"; // Component bạn cung cấp
import ButtonAction from "../../../../components//ButtonAction"; // Component bạn cung cấp

const API_URL = "http://localhost:8000/api/complaints/";

const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
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
      
      let listData = [];
      if (Array.isArray(data)) listData = data;
      else if (data && Array.isArray(data.results)) listData = data.results;
      
      // Sắp xếp: Pending lên đầu
      listData.sort((a, b) => (a.status === 'pending' ? -1 : 1));
      
      setReports(listData);
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu!");
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshReports();
  }, []);

  // --- Xử lý Logic Hành động (API) ---

  const handleReject = async (record) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}${record.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "rejected" }),
      });
      message.success("Đã từ chối khiếu nại!");
      refreshReports();
    } catch (err) {
      message.error("Lỗi kết nối!");
    }
  };

  const handleResetPending = async (record) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}${record.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "pending" }), // Reset về trạng thái chờ
      });
      message.success("Đã chuyển về chờ xử lý!");
      refreshReports();
    } catch (err) {
      message.error("Lỗi kết nối!");
    }
  };

  // --- Cấu hình Cột Bảng ---

  const columns = [
    { 
        title: "STT", 
        key: "index", 
        width: 60,
        align: 'center',
        render: (_, __, index) => index + 1 
    },
    { 
        title: "Người dùng", 
        dataIndex: "complainant_name",
        render: (text) => <b>{text}</b>
    },
    { 
        title: "Sản phẩm", 
        dataIndex: "product_name",
        ellipsis: { showTitle: false },
        render: (name) => (
            <Tooltip placement="topLeft" title={name}>{name}</Tooltip>
        )
    },
    {
      title: "Giá trị",
      key: "value",
      width: 150,
      render: (_, record) => {
        const unit = Number(record.unit_price ?? record.product_price ?? 0);
        const qty = record.quantity ?? 1;
        return (
            <span>
                {unit.toLocaleString("vi-VN")} đ <br/> 
                <small style={{color: '#888'}}>x{qty}</small>
            </span>
        );
      },
    },
    { 
        title: "Lý do", 
        dataIndex: "reason",
        width: 200,
        ellipsis: true
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      width: 160,
      render: (date) => (date ? new Date(date).toLocaleString("vi-VN") : ""),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      align: 'center',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Hành động",
      key: "action",
      width: 140,
      align: 'right',
      render: (_, record) => {
        // Cấu hình danh sách hành động cho ButtonAction
        const actions = [
            {
                actionType: 'view',
                icon: <EyeOutlined />,
                tooltip: "Xem chi tiết",
                onClick: () => {
                    setDetailComplaint(record);
                    setDetailModalVisible(true);
                }
            },
            {
                actionType: 'approve', // Màu xanh lá
                icon: <CheckCircleOutlined />,
                tooltip: "Giải quyết / Duyệt",
                show: record.status === 'pending',
                onClick: () => {
                    setResolveComplaint(record);
                    setResolveModalVisible(true);
                }
            },
            {
                actionType: 'reject', // Màu đỏ
                icon: <CloseCircleOutlined />,
                tooltip: "Từ chối khiếu nại",
                show: record.status === 'pending',
                confirm: {
                    title: "Từ chối khiếu nại này?",
                    description: "Hành động này sẽ đánh dấu khiếu nại là không hợp lệ.",
                    okText: "Từ chối",
                    cancelText: "Hủy",
                },
                onClick: () => handleReject(record)
            },
            {
                actionType: 'edit', // Màu cyan (Tạm dùng cho nút Reset)
                icon: <UndoOutlined />,
                tooltip: "Xử lý lại (Reset)",
                show: record.status !== 'pending',
                confirm: {
                    title: "Xử lý lại?",
                    description: "Chuyển trạng thái về 'Chờ xử lý'?",
                },
                onClick: () => handleResetPending(record)
            }
        ];

        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <AdminPageLayout 
        title="QUẢN LÝ KHIẾU NẠI NGƯỜI DÙNG" 
        extra={
            <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={refreshReports} 
                loading={loading}
            >
                Làm mới
            </Button>
        }
    >
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
            rowKey="id"
            columns={columns}
            dataSource={reports}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }} // Hỗ trợ responsive trên mobile
        />
      </Card>

      {/* Modal Xem chi tiết */}
      <ComplaintDetailModal
        visible={detailModalVisible}
        complaint={detailComplaint}
        onClose={() => setDetailModalVisible(false)}
      />

      {/* Modal Xử lý */}
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