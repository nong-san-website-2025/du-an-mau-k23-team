import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Modal, Button, Spin, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RecentDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://127.0.0.1:8000/api/complaints/complaints/recent/",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDisputes(res.data);
      } catch (err) {
        console.error("Fetch disputes error:", err.response || err);
        setError(
          err.response?.data?.detail ||
          err.message ||
          "Lỗi khi tải dữ liệu"
        );
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const statusColors = {
    pending: "red",
    in_progress: "gold",
    resolved: "green",
  };

  const statusLabels = {
    pending: "Chờ xử lý",
    in_progress: "Đang giải quyết",
    resolved: "Đã xử lý",
  };

  const columns = [
    {
      title: "Mã khiếu nại",
      dataIndex: "id",
      key: "id",
      render: (id) => <span>#{id}</span>,
    },
{
      title: "Đơn hàng",
      dataIndex: "order_id",
      key: "order_id",
      render: (val) => `#${val}`,
    },
    {
      title: "Người khiếu nại",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
  ];

  return (
    <Card title="">
      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 12 }}
          showIcon
        />
      )}
      {loading ? (
        <div style={{ textAlign: "center", padding: 30 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={disputes}
          pagination={false}
          onRow={(record) => ({
            onClick: () => setSelectedDispute(record),
          })}
          locale={{ emptyText: "Không có khiếu nại mới" }}
        />
      )}

      <Modal
        open={!!selectedDispute}
        title={`Chi tiết khiếu nại #${selectedDispute?.id}`}
        onCancel={() => setSelectedDispute(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedDispute(null)}>
            Đóng
          </Button>,
        ]}
      >
        {selectedDispute && (
          <div>
            <p>
              <b>Mã khiếu nại:</b> #{selectedDispute.id}
            </p>
            <p>
              <b>Đơn hàng:</b> #{selectedDispute.order_id}
            </p>
            <p>
              <b>Người khiếu nại:</b> {selectedDispute.customer_name}
            </p>
            <p>
              <b>Sản phẩm:</b> {selectedDispute.product_name}
            </p>
            <p>
              <b>Lý do:</b> {selectedDispute.reason}
            </p>
            <p>
              <b>Trạng thái:</b>{" "}
              <Tag color={statusColors[selectedDispute.status]}>
                {statusLabels[selectedDispute.status]}
              </Tag>
            </p>
            <p>
              <b>Ngày tạo:</b>{" "}
              {new Date(selectedDispute.created_at).toLocaleString("vi-VN")}
            </p>
          </div>
        )}
      </Modal>
    </Card>
  );
}
