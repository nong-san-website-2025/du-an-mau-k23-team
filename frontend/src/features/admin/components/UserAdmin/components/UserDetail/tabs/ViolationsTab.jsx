// Tab 3: Vi phạm
import React, { useEffect } from "react";
import { Table, Tag, Empty, Skeleton, Card } from "antd";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function ViolationsTab({ userId, onLoad, loading, data }) {
  useEffect(() => {
    if (onLoad && userId) {
      onLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!data && loading) return <Skeleton active />;

  if (loading) return <Skeleton active />;

  const getViolationIcon = (status) => {
    if (status === "resolved") return <CheckCircle size={16} color="#52c41a" />;
    if (status === "pending") return <Clock size={16} color="#faad14" />;
    return <AlertTriangle size={16} color="#ff4d4f" />;
  };

  const columns = [
    {
      title: "Loại vi phạm",
      dataIndex: "violation_type",
      key: "violation_type",
      render: (text) => <span style={{ fontWeight: "bold" }}>{text || "N/A"}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "35%",
      render: (text) => text || "Không có mô tả",
    },
    {
      title: "Ngày",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusMap = {
          resolved: { color: "green", label: "Đã xử lý" },
          pending: { color: "orange", label: "Chờ xử lý" },
          critical: { color: "red", label: "Nghiêm trọng" },
        };
        const s = statusMap[status] || { color: "default", label: status };
        return <Tag color={s.color} icon={getViolationIcon(status)}>{s.label}</Tag>;
      },
    },
  ];

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <Card>
          <Empty
            description="Không có vi phạm"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: "40px" }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Card title={<><AlertCircle size={16} style={{ marginRight: "8px" }} /> Danh sách vi phạm</>}>
        <Table
          columns={columns}
          dataSource={data.map((item, idx) => ({ ...item, key: idx }))}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
