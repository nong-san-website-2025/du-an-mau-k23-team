import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Modal, Button, Spin, Alert, Image } from "antd";
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
          "http://127.0.0.1:8000/api/complaints/recent/",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDisputes(res.data);
      } catch (err) {
        console.error("Fetch disputes error:", err.response || err);
        setError(
          err.response?.data?.detail || err.message || "Lỗi khi tải dữ liệu"
        );
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const formatOrderId = (id) => {
    if (!id) return "N/A";
    return `DH${id.toString().padStart(3, "0")}`;
  };
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
      title: "Sản phẩm", // <-- thêm cột sản phẩm
      dataIndex: "product_name",
      key: "product_name",
      render: (val) => val || <i>Không rõ</i>,
    },

    {
      title: "Đơn hàng",
      dataIndex: "order_id",
      key: "order_id",
      render: (orderId) => (
        orderId ? (
          <a href={`/orders/${orderId}`}>{formatOrderId(orderId)}</a>
        ) : (
          <span>{formatOrderId(orderId)}</span>
        )
      ),
    },

    {
      title: "Người khiếu nại",
      dataIndex: "complainant_name", // 👈 đổi lại cho đúng với JSON
      key: "complainant_name",
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
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (val) =>
        val ? new Date(val).toLocaleString("vi-VN") : <i>Không rõ</i>,
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
            style: { cursor: "pointer" },
          })}
          locale={{ emptyText: "Không có khiếu nại mới" }}
        />
      )}

      <Modal
        open={!!selectedDispute}
        title={`Chi tiết khiếu nại`}
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
              <b>Đơn hàng:</b> {selectedDispute.order_id ? `#${selectedDispute.order_id}` : "N/A"}
            </p>
            <p>
              <b>Người khiếu nại:</b> {selectedDispute.complainant_name}
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

            {/* Thêm hình ảnh khách hàng gửi */}
            <p>
              <b>Hình ảnh:</b>
            </p>
            {selectedDispute.media_urls &&
            selectedDispute.media_urls.length > 0 ? (
              selectedDispute.media_urls.map((url, idx) => (
                <Image
                  key={idx}
                  src={url}
                  width={120}
                  style={{ marginRight: 10, marginBottom: 10, borderRadius: 6 }}
                />
              ))
            ) : (
              <i>Không có hình ảnh</i>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
