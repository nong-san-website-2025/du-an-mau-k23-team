import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Modal, Button, Spin, Alert, Image } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RecentDisputes({ data: propData = [] }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();

  // ✅ 1. Đồng bộ biến môi trường giống TopSellingProducts
  const API_URL =
    process.env.REACT_APP_API_URL || "http://172.16.144.88:8000/api";
  const BASE_DOMAIN = new URL(API_URL).origin;

  useEffect(() => {
    // ✅ Nếu có data từ prop (dashboard), dùng luôn
    if (propData && Array.isArray(propData) && propData.length > 0) {
      console.log("📋 RecentDisputes received propData:", propData);
      setDisputes(propData);
      return;
    }

    const fetchDisputes = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        // Fallback: Gọi API riêng nếu không có prop data
        const res = await axios.get(`${API_URL}/complaints/recent/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDisputes(res.data);
      } catch (err) {
        console.error("Fetch disputes error:", err.response || err);
        // Thông báo lỗi cụ thể nếu gặp 404 (Not Found)
        setError(
          err.response?.status === 404
            ? "Lỗi 404: Không tìm thấy đường dẫn API khiếu nại. Vui lòng kiểm tra lại Backend."
            : err.response?.data?.detail || "Lỗi khi tải dữ liệu khiếu nại"
        );
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();

    const mql = window.matchMedia("(max-width: 480px)");
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handleChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handleChange);
  }, [API_URL]);

  // Hỗ trợ đầy đủ các trạng thái backend để hiển thị label và màu đúng
  const statusColors = {
    pending: "orange",
    negotiating: "purple",
    waiting_return: "gold",
    returning: "gold",
    admin_review: "blue",
    resolved_refund: "green",
    resolved_reject: "red",
    cancelled: "default",
  };
  const statusLabels = {
    pending: "Chờ xử lý",
    negotiating: "Đang thương lượng",
    waiting_return: "Chờ shop xác nhận - Chờ gửi trả",
    returning: "Đang trả hàng",
    admin_review: "Sàn đang xem xét",
    resolved_refund: "Đã hoàn tiền",
    resolved_reject: "Đã từ chối / Hủy",
    cancelled: "Đã hủy",
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id, // ✅ Thêm Sort
      render: (id) => <b>#{id}</b>,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      ellipsis: true,
      sorter: (a, b) =>
        (a.product_name || "").localeCompare(b.product_name || ""), // ✅ Thêm Sort
      render: (val) => val || <i>Không rõ</i>,
    },
    {
      title: "Người khiếu nại",
      dataIndex: "user_name",
      key: "user_name",
      responsive: ["md", "lg"],
      render: (val) => val || <i>Không rõ</i>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""), // ✅ Thêm Sort
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>
          {statusLabels[status] || status || "Chờ xử lý"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at), // ✅ Thêm Sort
      render: (val) => (val ? new Date(val).toLocaleString("vi-VN") : "N/A"),
    },
  ];

  // Hàm xử lý URL ảnh chuẩn
  const getFullImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${BASE_DOMAIN}${path.startsWith("/") ? "" : "/"}${path.startsWith("media") ? "" : "media/"}${path}`;
  };

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
          size={isMobile ? "small" : "middle"}
          scroll={isMobile ? { x: 600 } : undefined}
        />
      )}

      <Modal
        open={!!selectedDispute}
        title="Chi tiết khiếu nại"
        onCancel={() => setSelectedDispute(null)}
        footer={[
          <Button key="ok" onClick={() => setSelectedDispute(null)}>
            Đóng
          </Button>,
        ]}
      >
        {selectedDispute && (
          <div style={{ lineHeight: "2.5" }}>
            <p>
              <b>Mã đơn hàng:</b> {selectedDispute.order_id || "N/A"}
            </p>
            <p>
              <b>Người khiếu nại:</b> {selectedDispute.user_name || selectedDispute.user?.full_name || selectedDispute.complainant_name || 'N/A'}
            </p>
            { (selectedDispute.created_by_email || selectedDispute.user?.email) && (
              <p>
                <b>Email:</b> {selectedDispute.created_by_email || selectedDispute.user?.email}
              </p>
            ) }
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
              <b>Hình ảnh minh chứng:</b>
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {selectedDispute.media_urls?.length > 0 ? (
                selectedDispute.media_urls.map((url, idx) => (
                  <Image
                    key={idx}
                    src={getFullImageUrl(url)}
                    width={100}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                  />
                ))
              ) : (
                <i>Không có hình ảnh đính kèm</i>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
